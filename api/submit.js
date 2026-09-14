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

// Helper to parse multipart/form-data using busboy with multi-file support
function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB maximum per file
        files: 5,
        fields: 20
      }
    });

    const fields = {};
    const files = {};
    let fileLimitExceeded = false;

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, fileStream, info) => {
      const { filename, encoding, mimeType } = info;
      if (!filename) {
        fileStream.resume();
        return;
      }

      const chunks = [];
      let currentFileExceeded = false;

      fileStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      fileStream.on('limit', () => {
        currentFileExceeded = true;
        fileLimitExceeded = true;
      });

      fileStream.on('end', () => {
        if (!currentFileExceeded) {
          files[name] = {
            fieldname: name,
            filename: filename,
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
        const primaryFile = files.aadhar_file || files[Object.keys(files)[0]] || null;
        resolve({ fields, files, file: primaryFile });
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
    const { fields, files, file } = await parseMultipartForm(req);

    const fullName = (fields.name || fields.full_name || '').trim();
    const phone = (fields.mobile_number || fields.phone || '').trim().replace(/\D/g, '');
    const alternateMobile = (fields.alternate_mobile || '').trim().replace(/\D/g, '');
    const address = (fields.address || '').trim();
    const studentClass = (fields.class || fields.student_class || '').trim();
    const course = (fields.course || '').trim();
    const fatherName = (fields.father_name || '').trim();
    const email = (fields.email || '').trim().toLowerCase();
    const aadharNumber = (fields.aadhar_number || '').trim().replace(/\s|-/g, '');

    const aadharFile = files.aadhar_file || file;
    const photoFile = files.photo_file || files.student_photo || files.photo || null;

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

    // Aadhaar Document Validation
    if (!aadharFile || !aadharFile.buffer || aadharFile.buffer.length === 0) {
      errors.push('Aadhaar card document file (image or PDF) is required.');
    } else {
      const allowedDocTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];
      if (!allowedDocTypes.includes(aadharFile.mimeType.toLowerCase())) {
        errors.push('Unsupported Aadhaar file format. Please upload an image (JPG, PNG, WebP) or PDF file.');
      }
    }

    // Student Photo Validation
    if (!photoFile || !photoFile.buffer || photoFile.buffer.length === 0) {
      errors.push('Student passport-size photo is required.');
    } else {
      const allowedPhotoTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];
      if (!allowedPhotoTypes.includes(photoFile.mimeType.toLowerCase())) {
        errors.push('Unsupported student photo format. Please upload an image file (JPG, PNG, or WebP).');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(' ')
      });
    }

    // 4. Handle Storage & Database (Supabase Storage)
    const supabase = getSupabaseClient();
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'aadhar-documents';
    
    let aadharFileUrl = '';
    let aadharStoragePath = '';
    let photoFileUrl = '';
    let photoStoragePath = '';

    if (supabase) {
      // 4a. Upload Aadhaar file to Supabase Storage
      const cleanAadharName = aadharFile.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      aadharStoragePath = `aadhar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanAadharName}`;

      const { error: aadharUploadError } = await supabase.storage
        .from(bucketName)
        .upload(aadharStoragePath, aadharFile.buffer, {
          contentType: aadharFile.mimeType,
          upsert: false
        });

      if (aadharUploadError) {
        console.error('Supabase Aadhaar Storage Upload Error:', aadharUploadError);
        return res.status(500).json({
          success: false,
          error: `Aadhaar storage upload failed: ${aadharUploadError.message}`
        });
      }

      // Get Aadhaar public URL
      const { data: aadharUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(aadharStoragePath);
      aadharFileUrl = aadharUrlData?.publicUrl || '';

      // 4b. Upload Student Photo to Supabase Storage
      if (photoFile) {
        const cleanPhotoName = photoFile.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        photoStoragePath = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanPhotoName}`;

        const { error: photoUploadError } = await supabase.storage
          .from(bucketName)
          .upload(photoStoragePath, photoFile.buffer, {
            contentType: photoFile.mimeType,
            upsert: false
          });

        if (photoUploadError) {
          console.error('Supabase Photo Storage Upload Error:', photoUploadError);
          return res.status(500).json({
            success: false,
            error: `Student photo upload failed: ${photoUploadError.message}`
          });
        }

        const { data: photoUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(photoStoragePath);
        photoFileUrl = photoUrlData?.publicUrl || '';
      }
    }

    if (supabase) {
      // 4c. Insert Record into Supabase Database
      const recordPayload = {
        full_name: fullName,
        phone: phone,
        alternate_mobile: alternateMobile || null,
        address: address,
        class: studentClass,
        course: course,
        father_name: fatherName,
        email: email || null,
        aadhar_number: aadharNumber || null,
        aadhar_file_url: aadharFileUrl,
        aadhar_file_path: aadharStoragePath,
        photo_url: photoFileUrl || null,
        photo_file_path: photoStoragePath || null,
        file_name: aadharFile.filename,
        file_size: aadharFile.size,
        file_type: aadharFile.mimeType
      };

      let { data: insertData, error: insertError } = await supabase
        .from('submissions')
        .insert([recordPayload])
        .select('id, full_name, phone, created_at')
        .single();

      // Graceful fallback: If Supabase schema cache doesn't have photo columns yet, retry without photo columns
      if (insertError && (insertError.message.includes('photo_file_path') || insertError.message.includes('photo_url'))) {
        console.warn('⚠️ Supabase submissions table missing photo columns. Please run migration in Supabase SQL editor:');
        console.warn('ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS photo_url TEXT;');
        console.warn('ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS photo_file_path TEXT;');

        delete recordPayload.photo_url;
        delete recordPayload.photo_file_path;

        const retry = await supabase
          .from('submissions')
          .insert([recordPayload])
          .select('id, full_name, phone, created_at')
          .single();

        insertData = retry.data;
        insertError = retry.error;
      }

      if (insertError) {
        console.error('Supabase DB Insert Error:', insertError);
        return res.status(500).json({
          success: false,
          error: `Database record creation failed: ${insertError.message}`
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Registration and documents submitted successfully!',
        submissionId: insertData.id,
        photoUrl: photoFileUrl,
        timestamp: insertData.created_at
      });
    } else {
      // Demo / Mock Mode fallback (active when Supabase env vars are pending)
      console.warn('⚡ Running in Mock Demo Mode: Supabase credentials not configured in user-form/.env.');
      
      const mockId = 'REG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      
      const photoDataUrl = photoFile && photoFile.mimeType.startsWith('image/')
        ? `data:${photoFile.mimeType};base64,${photoFile.buffer.toString('base64')}`
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

      const aadharDataUrl = aadharFile.mimeType.startsWith('image/')
        ? `data:${aadharFile.mimeType};base64,${aadharFile.buffer.toString('base64')}`
        : 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';

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
        aadhar_file_url: aadharDataUrl,
        aadhar_file_path: aadharStoragePath,
        photo_url: photoDataUrl,
        photo_file_path: photoStoragePath,
        file_name: aadharFile.filename,
        file_size: aadharFile.size,
        file_type: aadharFile.mimeType,
        created_at: new Date().toISOString()
      };

      global.__MOCK_SUBMISSIONS__.unshift(mockRecord);

      return res.status(201).json({
        success: true,
        message: 'Registration submitted successfully! (Demo Mode - Supabase integration ready)',
        submissionId: mockId,
        photoUrl: photoDataUrl,
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
