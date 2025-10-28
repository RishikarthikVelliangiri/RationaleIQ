import React, { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';

const FileDropzone = ({ onFilesSelected, accept = '.pdf,.doc,.docx,.txt', multiple = true, maxSize = 10 * 1024 * 1024 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${maxSize / 1024 / 1024}MB`;
    }

    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      const fileMime = file.type.toLowerCase();
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExt === type;
        }
        return fileMime.includes(type.replace('*', ''));
      });

      if (!isAccepted) {
        return `File type "${fileExt}" is not supported. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const handleFiles = useCallback((files) => {
    setError('');
    const fileArray = Array.from(files);
    
    // Validate all files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (!multiple && fileArray.length > 1) {
      setError('Only one file can be uploaded at a time');
      return;
    }

    setSelectedFiles(prev => {
      const newFiles = multiple ? [...prev, ...fileArray] : fileArray;
      onFilesSelected?.(newFiles);
      return newFiles;
    });
  }, [multiple, onFilesSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const removeFile = (index) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      onFilesSelected?.(newFiles);
      return newFiles;
    });
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setError('');
    onFilesSelected?.([]);
  };

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
          ${isDragging 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center text-center">
            <div className={`
              p-3 rounded-full mb-3 transition-all duration-200
              ${isDragging 
                ? 'bg-primary-200 dark:bg-primary-800/50 scale-110' 
                : 'bg-gray-100 dark:bg-gray-800'
              }
            `}>
              <Upload className={`
                w-8 h-8 transition-colors duration-200
                ${isDragging 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-400 dark:text-gray-500'
                }
              `} />
            </div>
            
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              or click to browse
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Supported: {accept.replace(/\./g, '').toUpperCase()} • Max {maxSize / 1024 / 1024}MB
            </p>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-shake">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Selected Files ({selectedFiles.length})
            </p>
            <button
              onClick={clearAll}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 group animate-slide-in-left"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded">
                    <Upload className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
