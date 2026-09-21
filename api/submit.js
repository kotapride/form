import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy';
import { getCloudinary, uploadBufferToCloudinary } from './_lib/cloudinary.js';

// Vercel Serverless Function Configuration
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Supabase Client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
    return null; // Signals demo / mock mode
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// In-memory fallback storage for local demo testing when Supabase keys are not yet configured
global.__MOCK_SUBMISSIONS__ = global.__MOCK_SUBMISSIONS__ || [];

// Helper to normalize and infer MIME type & extension
function normalizeFileInfo(file) {
  if (!file || !file.filename) return null;

  const extMatch = file.filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';
  let mimeType = (file.mimeType || '').toLowerCase();

  // Canonical mapping for supported file types
  const extMap = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf'
  };

  // If MIME type is generic or missing, infer from extension
  if (!mimeType || mimeType === 'application/octet-stream' || mimeType === 'binary/octet-stream') {
    if (extMap[ext]) {
      mimeType = extMap[ext];
    }
  } else if (mimeType === 'image/pjpeg' || mimeType === 'image/jpg') {
    mimeType = 'image/jpeg';
  } else if (mimeType === 'image/x-png') {
    mimeType = 'image/png';
  } else if (mimeType === 'application/x-pdf') {
    mimeType = 'application/pdf';
  }

  return {
    ...file,
    normalizedMime: mimeType || 'application/octet-stream',
    extension: ext
  };
}

// Helper to parse multipart/form-data using busboy with multi-file Promise tracking
function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    let busboy;
    try {
      busboy = Busboy({
        headers: req.headers,
        limits: {
          fileSize: 10 * 1024 * 1024, // 10MB maximum per file
          files: 5,
          fields: 30
        }
      });
    } catch (initErr) {
      return reject(initErr);
    }

    const fields = {};
    const files = {};
    const filePromises = [];
    let isSettled = false;

    const fail = (err) => {
      if (!isSettled) {
        isSettled = true;
        reject(err);
      }
    };

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, fileStream, info) => {
      const filename = info?.filename || '';
      const mimeType = info?.mimeType || info?.mimetype || 'application/octet-stream';

      if (!filename) {
        fileStream.resume();
        return;
      }

      const filePromise = new Promise((resFile, rejFile) => {
        const chunks = [];
        let fileLimitExceeded = false;

        fileStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        fileStream.on('limit', () => {
          fileLimitExceeded = true;
        });

        fileStream.on('error', (streamErr) => {
          rejFile(streamErr);
        });

        fileStream.on('end', () => {
          if (fileLimitExceeded) {
            return rejFile(new Error(`File "${filename}" exceeds the maximum allowed size.`));
          }
          const buffer = Buffer.concat(chunks);
          files[name] = {
            fieldname: name,
            filename: filename,
            mimeType: mimeType,
            buffer: buffer,
            size: buffer.length
          };
          resFile();
        });
      });

      filePromises.push(filePromise);
    });

    busboy.on('error', (err) => {
      fail(err);
    });

    // In Busboy 1.x, 'close' fires once all parts have completed parsing
    busboy.on('close', async () => {
      try {
        await Promise.all(filePromises);
        if (!isSettled) {
          isSettled = true;
          const primaryFile = files.aadhar_file || files[Object.keys(files)[0]] || null;
          resolve({ fields, files, file: primaryFile });
        }
      } catch (err) {
        fail(err);
      }
    });

    // Pipe the request stream into busboy (handling buffered body from Vercel / serverless runtime)
    if (Buffer.isBuffer(req.rawBody)) {
      busboy.end(req.rawBody);
    } else if (Buffer.isBuffer(req.body)) {
      busboy.end(req.body);
    } else if (req.rawBody && typeof req.rawBody === 'string') {
      busboy.end(Buffer.from(req.rawBody));
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

    // 2. Parse Multipart Form with async multi-stream support
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

    // Normalized file checks
    const normalizedAadhar = normalizeFileInfo(aadharFile);
    const normalizedPhoto = normalizeFileInfo(photoFile);

    const allowedDocExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const allowedDocMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    const allowedPhotoExts = ['jpg', 'jpeg', 'png', 'webp'];
    const allowedPhotoMimes = ['image/jpeg', 'image/png', 'image/webp'];

    // Aadhaar Document Validation
    if (!normalizedAadhar || !normalizedAadhar.buffer || normalizedAadhar.buffer.length === 0) {
      errors.push('Aadhaar card document file (image or PDF) is required.');
    } else {
      const isExtValid = allowedDocExts.includes(normalizedAadhar.extension);
      const isMimeValid = allowedDocMimes.includes(normalizedAadhar.normalizedMime);
      if (!isExtValid && !isMimeValid) {
        errors.push('Unsupported Aadhaar file format. Please upload an image (JPG, PNG, WebP) or PDF file.');
      }
    }

    // Student Photo Validation
    if (!normalizedPhoto || !normalizedPhoto.buffer || normalizedPhoto.buffer.length === 0) {
      errors.push('Student passport-size photo is required.');
    } else {
      const isExtValid = allowedPhotoExts.includes(normalizedPhoto.extension);
      const isMimeValid = allowedPhotoMimes.includes(normalizedPhoto.normalizedMime);
      if (!isExtValid && !isMimeValid) {
        errors.push('Unsupported student photo format. Please upload an image file (JPG, PNG, or WebP).');
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
    const cloudinaryClient = getCloudinary();
    
    let aadharFileUrl = '';
    let aadharStoragePath = '';
    let photoFileUrl = '';
    let photoStoragePath = '';

    // If Cloudinary is configured, prefer Cloudinary for reliable media hosting
    if (cloudinaryClient) {
      try {
        const aadharUpload = await uploadBufferToCloudinary(normalizedAadhar.buffer, {
          folder: 'student_registrations/aadhar',
          resource_type: normalizedAadhar.normalizedMime === 'application/pdf' ? 'raw' : 'image'
        });
        aadharFileUrl = aadharUpload.secure_url;
        aadharStoragePath = aadharUpload.public_id;

        if (normalizedPhoto) {
          const photoUpload = await uploadBufferToCloudinary(normalizedPhoto.buffer, {
            folder: 'student_registrations/photos',
            resource_type: 'image'
          });
          photoFileUrl = photoUpload.secure_url;
          photoStoragePath = photoUpload.public_id;
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to Supabase:', cloudErr.message);
      }
    }

    // Supabase Storage fallback or primary
    if (supabase && (!aadharFileUrl || !photoFileUrl)) {
      if (!aadharFileUrl) {
        const cleanAadharExt = normalizedAadhar.extension ? `.${normalizedAadhar.extension}` : '';
        const cleanAadharBase = normalizedAadhar.filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        aadharStoragePath = `aadhar_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanAadharBase}${cleanAadharExt}`;

        const { error: aadharUploadError } = await supabase.storage
          .from(bucketName)
          .upload(aadharStoragePath, normalizedAadhar.buffer, {
            contentType: normalizedAadhar.normalizedMime || 'application/octet-stream',
            upsert: false
          });

        if (aadharUploadError) {
          console.error('Supabase Aadhaar Storage Upload Error:', aadharUploadError);
          return res.status(500).json({
            success: false,
            error: `Aadhaar storage upload failed: ${aadharUploadError.message}`
          });
        }

        const { data: aadharUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(aadharStoragePath);
        aadharFileUrl = aadharUrlData?.publicUrl || '';
      }

      if (normalizedPhoto && !photoFileUrl) {
        const cleanPhotoExt = normalizedPhoto.extension ? `.${normalizedPhoto.extension}` : '.jpg';
        const cleanPhotoBase = normalizedPhoto.filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        photoStoragePath = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanPhotoBase}${cleanPhotoExt}`;

        const { error: photoUploadError } = await supabase.storage
          .from(bucketName)
          .upload(photoStoragePath, normalizedPhoto.buffer, {
            contentType: normalizedPhoto.normalizedMime || 'image/jpeg',
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
        file_name: normalizedAadhar.filename,
        file_size: normalizedAadhar.size,
        file_type: normalizedAadhar.normalizedMime
      };

      let { data: insertData, error: insertError } = await supabase
        .from('submissions')
        .insert([recordPayload])
        .select('id, full_name, phone, created_at')
        .single();

      // Graceful fallback: If Supabase schema cache doesn't have photo columns yet, retry without photo columns
      if (insertError && (insertError.message.includes('photo_file_path') || insertError.message.includes('photo_url'))) {
        console.warn('⚠️ Supabase submissions table missing photo columns. Retrying insert without photo columns...');

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
      
      const photoDataUrl = normalizedPhoto && normalizedPhoto.normalizedMime.startsWith('image/')
        ? `data:${normalizedPhoto.normalizedMime};base64,${normalizedPhoto.buffer.toString('base64')}`
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

      const aadharDataUrl = normalizedAadhar.normalizedMime.startsWith('image/')
        ? `data:${normalizedAadhar.normalizedMime};base64,${normalizedAadhar.buffer.toString('base64')}`
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
        file_name: normalizedAadhar.filename,
        file_size: normalizedAadhar.size,
        file_type: normalizedAadhar.normalizedMime,
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

