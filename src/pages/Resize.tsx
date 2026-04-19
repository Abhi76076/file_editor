import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Maximize, Image as ImageIcon, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { Layout } from '@/components/layout/Layout';
import { UniversalFileDropzone } from '@/components/pdf/UniversalFileDropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ProcessedFile, downloadBlob, getFileExtension } from '@/lib/file-utils';
import { isImageFile, getEncryptedFileName } from '@/lib/crypto-utils';
import { resizeImage } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

const Resize = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [resizeMode, setResizeMode] = useState<'percentage' | 'dimensions'>('percentage');
  const [percentage, setPercentage] = useState('50');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const handleResize = useCallback(async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one image file.',
        variant: 'destructive',
      });
      return;
    }

    let resizeOptions: { percentage?: number; width?: number; height?: number } = {};

    if (resizeMode === 'percentage') {
      const p = parseInt(percentage, 10);
      if (isNaN(p) || p <= 0) {
        toast({ title: 'Invalid percentage', variant: 'destructive' });
        return;
      }
      resizeOptions.percentage = p;
    } else {
      const w = parseInt(width, 10);
      const h = parseInt(height, 10);
      
      if (isNaN(w) && isNaN(h)) {
        toast({ title: 'Invalid dimensions', description: 'Please enter at least width or height', variant: 'destructive' });
        return;
      }
      if (!isNaN(w) && w > 0) resizeOptions.width = w;
      if (!isNaN(h) && h > 0) resizeOptions.height = h;
    }

    setIsProcessing(true);
    setIsComplete(false);

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
      setFiles([...updatedFiles]);

      try {
        const file = updatedFiles[i].originalFile;
        if (!isImageFile(file)) {
          throw new Error('Only image files can be resized');
        }

        const resizedBlob = await resizeImage(file, resizeOptions);
        
        // Build new filename
        const ext = getFileExtension(file.name);
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const newName = `${nameWithoutExt}_resized.${ext || 'jpg'}`;

        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'success',
          processedBlob: resizedBlob,
          name: newName,
        };
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to resize image',
        };
      }

      setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
    setIsComplete(true);

    const successCount = updatedFiles.filter((f) => f.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: 'Resizing complete',
        description: `Successfully resized ${successCount} image${successCount > 1 ? 's' : ''}.`,
      });
    }
  }, [files, resizeMode, percentage, width, height, toast]);

  const handleDownload = useCallback((file: ProcessedFile) => {
    if (file.processedBlob) {
      downloadBlob(file.processedBlob, file.name);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.processedBlob);
    
    if (successFiles.length === 0) return;

    if (successFiles.length === 1) {
      handleDownload(successFiles[0]);
      return;
    }

    const zip = new JSZip();
    for (const file of successFiles) {
      if (file.processedBlob) {
        zip.file(file.name, file.processedBlob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'resized_images.zip');
  }, [files, handleDownload]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setIsComplete(false);
  }, []);

  const canProcess = files.length > 0 && !isProcessing && (
    (resizeMode === 'percentage' && parseInt(percentage, 10) > 0) ||
    (resizeMode === 'dimensions' && (parseInt(width, 10) > 0 || parseInt(height, 10) > 0))
  );

  const successFiles = files.filter((f) => f.status === 'success');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary text-primary-foreground mb-4 shadow-glow">
              <Maximize className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Resize Images
            </h1>
            <p className="text-muted-foreground">
              Scale images to exact pixel dimensions, or scale them down by percentage.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {!isComplete ? (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">1. Upload Images</h2>
                  <UniversalFileDropzone 
                    files={files as any} 
                    onFilesChange={(f) => setFiles(f as ProcessedFile[])}
                    acceptedTypes="image"
                  />
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">2. Resize Options</h2>
                  
                  <RadioGroup 
                    value={resizeMode} 
                    onValueChange={(val) => setResizeMode(val as 'percentage' | 'dimensions')}
                    className="grid grid-cols-2 gap-4 mb-6"
                  >
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${resizeMode === 'percentage' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setResizeMode('percentage')}>
                      <RadioGroupItem value="percentage" id="percentage" className="sr-only" />
                      <Label htmlFor="percentage" className="font-medium cursor-pointer block mt-1">By Percentage</Label>
                      <p className="text-xs text-muted-foreground mt-1">Scale relatively (e.g., 50%)</p>
                    </div>
                    <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${resizeMode === 'dimensions' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setResizeMode('dimensions')}>
                      <RadioGroupItem value="dimensions" id="dimensions" className="sr-only" />
                      <Label htmlFor="dimensions" className="font-medium cursor-pointer block mt-1">By Dimensions</Label>
                      <p className="text-xs text-muted-foreground mt-1">Specify Width and/or Height</p>
                    </div>
                  </RadioGroup>

                  {resizeMode === 'percentage' ? (
                    <div className="space-y-3">
                      <Label htmlFor="perc-input">Scale Percentage (%)</Label>
                      <Input 
                        id="perc-input"
                        type="number"
                        min="1"
                        max="500"
                        value={percentage}
                        onChange={(e) => setPercentage(e.target.value)}
                        placeholder="e.g. 50"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="width-input">Width (px)</Label>
                        <Input 
                          id="width-input"
                          type="number"
                          min="1"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="Auto"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="height-input">Height (px)</Label>
                        <Input 
                          id="height-input"
                          type="number"
                          min="1"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Auto"
                        />
                      </div>
                      <p className="col-span-2 text-xs text-muted-foreground">
                        If you leave one field empty, the image will scale proportionally based on the other field.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Secure & Fast Offline Resizing</p>
                    <p className="text-muted-foreground">
                      Your images run through your browser's native capabilities entirely offline.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleResize}
                  disabled={!canProcess}
                  className="w-full h-14 text-lg gap-2 gradient-primary text-primary-foreground shadow-glow"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Resizing...
                    </>
                  ) : (
                    <>
                      <Maximize className="w-5 h-5" />
                      Resize {files.length ? `${files.length} Image${files.length > 1 ? 's' : ''}` : ''}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h2 className="font-semibold text-foreground mb-4">Download Resized Images</h2>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          file.status === 'success'
                            ? 'bg-success/5 border-success/20'
                            : 'bg-destructive/5 border-destructive/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {file.status === 'success' ? 'Resized successfully' : file.error}
                            </p>
                          </div>
                        </div>
                        {file.status === 'success' && (
                          <Button size="sm" onClick={() => handleDownload(file)}>
                            Download
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {successFiles.length > 1 && (
                      <Button
                        onClick={handleDownloadAll}
                        className="w-full h-12 gap-2 gradient-primary text-primary-foreground"
                      >
                        Download All as ZIP
                      </Button>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12"
                >
                  Resize More Images
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Resize;
