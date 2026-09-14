import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';

// Initialize Supabase Client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return null; // Signals demo / mock mode
  }

  return createClient(supabaseUrl, supabaseKey);
}

// In-memory fallback storage for local demo testing when Supabase keys are not yet configured
global.__MOCK_SUBMISSIONS__ = global.__MOCK_SUBMISSIONS__ || [];

// Helper to parse multipart/form-data using busboy
function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB maximum
        files: 1,
        fields: 15
      }
    });

    const fields = {};
    let fileData = null;
    let fileLimitExceeded = false;

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, fileStream, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];

      fileStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      fileStream.on('limit', () => {
        fileLimitExceeded = true;
      });

      fileStream.on('end', () => {
        if (!fileLimitExceeded) {
          fileData = {
            fieldname: name,
            filename: filename || 'aadhar_document',
            mimeType: mimeType || 'application/octet-stream',
            buffer: Buffer.concat(chunks),
            size: Buffer.concat(chunks).length
          };
        }
      });
    });

    busboy.on('error', (err) => {
      reject(err);
    });

    busboy.on('finish', () => {
      if (fileLimitExceeded) {
        reject(new Error('File size exceeds the 5MB limit.'));
      } else {
        resolve({ fields, file: fileData });
      }
    });

    // Pipe the request stream into busboy
    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  });
}

// Primary Serverless Handler (Vercel Node.js Runtime)
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed. Please use POST.`
    });
  }

  try {
    // 1. Check Content-Type
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type. Form submission must be multipart/form-data.'
      });
    }

    // 2. Parse Multipart Form
    const { fields, file } = await parseMultipartForm(req);

    const fullName = (fields.name || fields.full_name || '').trim();
    const phone = (fields.mobile_number || fields.phone || '').trim().replace(/\D/g, '');
    const alternateMobile = (fields.alternate_mobile || '').trim().replace(/\D/g, '');
    const address = (fields.address || '').trim();
    const studentClass = (fields.class || fields.student_class || '').trim();
    const course = (fields.course || '').trim();
    const fatherName = (fields.father_name || '').trim();
    const email = (fields.email || '').trim().toLowerCase();
    const aadharNumber = (fields.aadhar_number || '').trim().replace(/\s|-/g, '');

    // 3. Server-side Validation
    const errors = [];
    if (!fullName || fullName.length < 2) {
      errors.push('Name is required (at least 2 characters).');
    }

    if (!phone || phone.length !== 10) {
      errors.push('A valid 10-digit mobile number is required.');
    }
    
    if (alternateMobile && alternateMobile.length !== 10) {
      errors.push('Alternate mobile must be exactly 10 digits if provided.');
    }

    if (!address || address.length < 5) {
      errors.push('Address is required (at least 5 characters).');
    }

    if (!studentClass) {
      errors.push('Class is required.');
    }
    
    if (!course) {
      errors.push('Course is required.');
    }

    if (!fatherName || fatherName.length < 2) {
      errors.push("Father's Name is required.");
    }

    if (!file || !file.buffer || file.buffer.length === 0) {
      errors.push('Aadhaar card document file (image or PDF) is required.');
    } else {
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];
      if (!allowedMimeTypes.includes(file.mimeType.toLowerCase())) {
        errors.push('Unsupported file format. Please upload an image (JPG, PNG, WebP) or PDF file.');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(' ')
      });
    }

    // 4. Handle Storage & Database
    const supabase = getSupabaseClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'aadhar-documents';
    const cleanFileName = file.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `aadhar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanFileName}`;

    let fileUrl = '';

    if (supabase) {
      // 4a. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, file.buffer, {
          contentType: file.mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase Storage Upload Error:', uploadError);
        return res.status(500).json({
          success: false,
          error: `Storage upload failed: ${uploadError.message}`
        });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

      fileUrl = urlData?.publicUrl || '';

      // 4b. Insert Record into Supabase Database
      const { data: insertData, error: insertError } = await supabase
        .from('submissions')
        .insert([
          {
            full_name: fullName,
            phone: phone,
            alternate_mobile: alternateMobile || null,
            address: address,
            class: studentClass,
            course: course,
            father_name: fatherName,
            email: email || null,
            aadhar_number: aadharNumber || null,
            aadhar_file_url: fileUrl,
            aadhar_file_path: storagePath,
            file_name: file.filename,
            file_size: file.size,
            file_type: file.mimeType
          }
        ])
        .select('id, full_name, phone, created_at')
        .single();

      if (insertError) {
        console.error('Supabase DB Insert Error:', insertError);
        return res.status(500).json({
          success: false,
          error: `Database record creation failed: ${insertError.message}`
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Registration and Aadhaar document submitted successfully!',
        submissionId: insertData.id,
        timestamp: insertData.created_at
      });
    } else {
      // Demo / Mock Mode fallback (active when Supabase env vars are pending)
      console.warn('⚡ Running in Mock Demo Mode: Supabase credentials not configured in user-form/.env.');
      
      const mockId = 'REG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const mockRecord = {
        id: mockId,
        full_name: fullName,
        phone: phone,
        alternate_mobile: alternateMobile,
        address: address,
        class: studentClass,
        course: course,
        father_name: fatherName,
        email: email || '',
        aadhar_number: aadharNumber || '',
        aadhar_file_url: file.mimeType.startsWith('image/')
          ? `data:${file.mimeType};base64,${file.buffer.toString('base64')}`
          : 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
        aadhar_file_path: storagePath,
        file_name: file.filename,
        file_size: file.size,
        file_type: file.mimeType,
        created_at: new Date().toISOString()
      };

      global.__MOCK_SUBMISSIONS__.unshift(mockRecord);

      return res.status(201).json({
        success: true,
        message: 'Registration submitted successfully! (Demo Mode - Supabase integration ready)',
        submissionId: mockId,
        timestamp: mockRecord.created_at,
        isDemo: true
      });
    }
  } catch (err) {
    console.error('Submit Handler Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An unexpected error occurred during submission.'
    });
  }
}
