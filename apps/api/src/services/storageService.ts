// apps/api/src/services/storageService.ts
// Free cloud storage service (Supabase, Firebase, Cloudinary)

import path from 'path';
import fs from 'fs';

interface StorageOptions {
  file: Buffer;
  fileName: string;
  contentType: string;
  bucket?: string;
}

interface StorageResult {
  url: string;
  path: string;
  size: number;
}

class StorageService {
  private static provider: 'local' | 'supabase' | 'firebase' | 'cloudinary' = 'local';
  
  // Local storage (current setup - FREE)
  static async storeLocal(options: StorageOptions): Promise<StorageResult> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const fileName = `${Date.now()}-${options.fileName}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, options.file);
    
    return {
      url: `/uploads/${fileName}`,
      path: filePath,
      size: options.file.length
    };
  }
  
  // Supabase storage (FREE tier: 1GB + 2GB bandwidth)
  static async storeSupabase(options: StorageOptions): Promise<StorageResult> {
    // Implementation for Supabase
    // npm install @supabase/supabase-js
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      );
      
      const bucket = options.bucket || 'uploads';
      const fileName = `${Date.now()}-${options.fileName}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(`public/${fileName}`, options.file, {
          contentType: options.contentType,
          upsert: false
        });
      
      if (error) throw error;
      
      return {
        url: data.path,
        path: data.path,
        size: options.file.length
      };
    } catch (error: any) {
      console.error('Supabase storage error:', error);
      throw new Error('Failed to store in Supabase');
    }
  }
  
  // Firebase storage (FREE tier: 1GB + 10GB bandwidth)
  static async storeFirebase(options: StorageOptions): Promise<StorageResult> {
    // Implementation for Firebase
    // npm install firebase-admin
    try {
      const admin = require('firebase-admin');
      const serviceAccount = require('../../firebase-service-account.json');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      
      const bucket = admin.storage().bucket();
      const fileName = `${Date.now()}-${options.fileName}`;
      
      const file = bucket.file(fileName);
      
      await file.save(options.file, {
        metadata: {
          contentType: options.contentType
        }
      });
      
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // 100 years
      });
      
      return {
        url: url,
        path: fileName,
        size: options.file.length
      };
    } catch (error: any) {
      console.error('Firebase storage error:', error);
      throw new Error('Failed to store in Firebase');
    }
  }
  
  // Cloudinary storage (FREE tier: 25GB + 25GB bandwidth)
  static async storeCloudinary(options: StorageOptions): Promise<StorageResult> {
    // Implementation for Cloudinary
    // npm install cloudinary
    try {
      const cloudinary = require('cloudinary').v2;
      
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: options.bucket || 'uploads',
            public_id: `${Date.now()}-${options.fileName.split('.')[0]}`,
          },
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(options.file);
      });
      
      return {
        url: result.secure_url,
        path: result.public_id,
        size: options.file.length
      };
    } catch (error: any) {
      console.error('Cloudinary storage error:', error);
      throw new Error('Failed to store in Cloudinary');
    }
  }
  
  // Main storage method
  static async storeFile(options: StorageOptions): Promise<StorageResult> {
    // Start with local storage (always available)
    const localResult = await this.storeLocal(options);
    
    // Try cloud storage if configured (free tier)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        const cloudResult = await this.storeSupabase(options);
        console.log('File stored in Supabase:', cloudResult.url);
        return cloudResult;
      } catch (error: any) {
        console.log('Supabase failed, using local storage:', error.message);
      }
    }
    
    if (process.env.FIREBASE_STORAGE_BUCKET) {
      try {
        const cloudResult = await this.storeFirebase(options);
        console.log('File stored in Firebase:', cloudResult.url);
        return cloudResult;
      } catch (error: any) {
        console.log('Firebase failed, using local storage:', error.message);
      }
    }
    
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        const cloudResult = await this.storeCloudinary(options);
        console.log('File stored in Cloudinary:', cloudResult.url);
        return cloudResult;
      } catch (error: any) {
        console.log('Cloudinary failed, using local storage:', error.message);
      }
    }
    
    // Fallback to local storage
    console.log('Using local storage:', localResult.url);
    return localResult;
  }
  
  // Delete file from storage
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Try cloud storage first
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const { error } = await supabase.storage
          .from('uploads')
          .remove([filePath]);
        
        if (!error) return true;
      }
      
      // Fallback to local storage
      const localPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Delete file error:', error);
      return false;
    }
  }
}

export default StorageService;
