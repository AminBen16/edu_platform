# 📁 File Storage Structure & Configuration

## 🗂️ **Current File Storage Location**

### **Server-Side Storage**
```
c:\Users\user\Desktop\edu_platform\apps\api\uploads\
```

### **How Files Are Stored**
1. **Upload Directory**: `apps/api/uploads/` (created automatically)
2. **File Naming**: `{timestamp}-{original-filename}`
   - Example: `1704931234567-introduction_to_algebra.mp4`
3. **Database Reference**: `/uploads/{filename}` stored in database
4. **File Access**: Served via static file serving

## 📱 **Mobile App Download Storage**

### **Android Storage Location**
```
/storage/emulated/0/Android/data/com.eduplatform.mobile/files/
```

### **Downloaded Files**
- **Videos**: `{course-title}_offline.mp4`
- **Audio**: `{course-title}_offline.mp3`  
- **Documents**: `{course-title}_document.pdf`

## 🔧 **Storage Configuration**

### **API Configuration (files.ts)**
```typescript
// Upload directory creation
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File naming strategy
const fileName = `${Date.now()}-${file.originalname}`;
const filePath = path.join(uploadsDir, fileName);
```

### **Database Storage**
```typescript
// LessonResource model stores:
{
  title: string,
  type: string,        // 'VIDEO', 'AUDIO', 'DOCUMENT'
  url: string,         // '/uploads/filename'
  size: number,        // File size in bytes
  lessonId: string,    // Associated lesson
  teacherId: string    // Who uploaded it
}
```

### **Mobile Download Configuration**
```dart
// External storage directory
final directory = await getExternalStorageDirectory();
final savePath = '${directory!.path}/${title.replaceAll(' ', '_')}.mp4';
```

## 📊 **File Types & Storage**

### **Supported File Types**
| Type | Extensions | Storage Location | Typical Size |
|------|------------|------------------|-------------|
| **Video** | .mp4, .webm, .avi, .mov | `/uploads/` | 25-200 MB |
| **Audio** | .mp3, .wav, .m4a, .ogg, .aac | `/uploads/` | 3-20 MB |
| **Documents** | .pdf, .doc, .docx, .ppt, .pptx | `/uploads/` | 0.5-10 MB |
| **Images** | .jpg, .png, .gif | `/uploads/` | 0.1-5 MB |

### **Storage Examples**
```
apps/api/uploads/
├── 1704931234567-introduction_to_algebra.mp4      (Video lesson)
├── 1704931234568-mathematics_lecture_1.mp3          (Audio lecture)
├── 1704931234569-course_syllabus.pdf              (Document)
├── 1704931234570-classroom_photo.jpg                (Image)
└── 1704931234571-assignment_instructions.docx       (Document)
```

## 🗂️ **Mobile Download Storage**

### **Android Storage Path**
```
/storage/emulated/0/Android/data/com.eduplatform.mobile/files/
├── Mathematics_Introduction_to_Algebra_offline.mp4
├── Mathematics_Lecture_1_Basics_offline.mp3
├── Mathematics_Course_Syllabus_offline.pdf
└── Downloads/
    ├── video_downloads/
    ├── audio_downloads/
    └── document_downloads/
```

### **iOS Storage Path**
```
/var/mobile/Containers/Data/Application/{APP_ID}/Documents/
├── Mathematics_Introduction_to_Algebra_offline.mp4
├── Mathematics_Lecture_1_Basics_offline.mp3
└── Mathematics_Course_Syllabus_offline.pdf
```

## 🔍 **File Access Methods**

### **Server-Side Access**
1. **API Endpoint**: `GET /files` - List available files
2. **File URL**: `GET /uploads/{filename}` - Download file
3. **Database Query**: `LessonResource.findMany()` - Get file metadata

### **Mobile App Access**
1. **Online Streaming**: Direct URL to server file
2. **Offline Access**: Local downloaded files
3. **Mixed Mode**: Check local first, fallback to server

## 📈 **Storage Management**

### **Server-Side**
- **Automatic Directory Creation**: Uploads folder created on first upload
- **File Naming**: Timestamp prefix prevents conflicts
- **Database Sync**: File metadata stored in LessonResource table
- **Cleanup**: Manual cleanup of old files (not automated)

### **Mobile-Side**
- **Permission Handling**: Storage permissions requested before download
- **File Organization**: Organized by course and media type
- **Storage Monitoring**: File size information shown before download
- **Cleanup Options**: Users can delete downloaded files

## 🚀 **Production Considerations**

### **For Production Deployment**
1. **Cloud Storage**: Consider AWS S3, Google Cloud Storage, or Azure Blob Storage
2. **CDN Integration**: Use CloudFront or Cloudflare for faster delivery
3. **File Compression**: Compress videos and optimize file sizes
4. **Backup Strategy**: Regular backups of uploaded content

### **Current Limitations**
- **Local Storage Only**: Files stored on server's local disk
- **No Automatic Cleanup**: Old files accumulate over time
- **No File Versioning**: Overwrites files with same name
- **No Cloud Sync**: No automatic cloud backup

## 🔧 **How to Check Current Storage**

### **Check Upload Directory**
```bash
cd apps/api
ls -la uploads/
```

### **Check Database Records**
```sql
SELECT * FROM "LessonResource" 
WHERE schoolId = 'your-school-id'
ORDER BY createdAt DESC;
```

### **Check Mobile Downloads**
```dart
// In mobile app
final directory = await getExternalStorageDirectory();
print('Download directory: $directory');
```

## 📋 **Storage Recommendations**

### **For Development**
- **Current setup is fine** for testing and small deployments
- **Monitor disk space** regularly
- **Clean up test files** periodically

### **For Production**
- **Implement cloud storage** (AWS S3 recommended)
- **Add file cleanup** automation
- **Set up monitoring** for storage usage
- **Implement backup** strategy

### **For Large Scale**
- **Use CDN** for file delivery
- **Implement file versioning**
- **Add storage quotas** per user/school
- **Consider file transcoding** for optimization

---

**🎯 Current Status: Files are stored locally on the server in `apps/api/uploads/` and downloaded to mobile device storage for offline access!**
