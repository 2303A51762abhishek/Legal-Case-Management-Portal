const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Document title is mandatory'],
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        'PETITION',
        'AFFIDAVIT',
        'ORDER',
        'EVIDENCE',
        'VAKALATNAMA',
        'OTHER',
      ],
      default: 'OTHER',
      index: true,
    },
    case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: [true, 'Linked case reference is required'],
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user reference is required'],
      index: true,
    },
    filePath: {
      type: String,
      required: [true, 'Document storage path is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ case: 1, documentType: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
