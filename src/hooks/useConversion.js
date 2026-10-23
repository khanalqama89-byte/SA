import { useState, useRef, useEffect } from 'react';
import { fileService } from '../services/fileService';
import { conversionService } from '../services/conversionService';

export function useConversion(toolSlug) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [stage, setStage] = useState('IDLE'); // 'IDLE' | 'UPLOADING' | 'CONVERTING' | 'COMPLETED' | 'FAILED'
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');

  const pollingRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const selectFile = (file) => {
    setSelectedFile(file);
    setStage('IDLE');
    setProgress(0);
    setErrorMessage(null);
    setJobId(null);
    setOutputFileName('');
  };

  const removeFile = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedFile(null);
    setStage('IDLE');
    setProgress(0);
    setErrorMessage(null);
    setJobId(null);
    setOutputFileName('');
  };

  const startProcess = async (options = {}) => {
    if (!selectedFile) return;

    try {
      setErrorMessage(null);
      setStage('UPLOADING');
      setStatusMessage('Uploading document securely...');
      setProgress(10);

      // 1. Upload File with Progress Tracking
      const fileRecord = await fileService.uploadFile(selectedFile, (uploadPct) => {
        setProgress(Math.round(uploadPct * 0.4)); // upload accounts for 0-40% of total flow
      });

      // 2. Create Conversion Job
      setStage('CONVERTING');
      setStatusMessage('Queuing document conversion...');
      setProgress(45);

      const jobResponse = await conversionService.startConversion(toolSlug, fileRecord.id, options);
      const newJobId = jobResponse.jobId;
      setJobId(newJobId);

      // 3. Poll Conversion Progress
      setStatusMessage('Processing document with SA Engine...');
      pollJobStatus(newJobId);

    } catch (err) {
      setStage('FAILED');
      setErrorMessage(err.message || 'An unexpected error occurred during processing.');
    }
  };

  const pollJobStatus = (targetJobId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const statusData = await conversionService.getJobStatus(targetJobId);

        if (statusData.status === 'PROCESSING') {
          const mappedProgress = Math.max(50, Math.min(95, statusData.progress || 60));
          setProgress(mappedProgress);
          setStatusMessage(`Converting document... (${mappedProgress}%)`);
        } else if (statusData.status === 'COMPLETED') {
          clearInterval(pollingRef.current);
          setProgress(100);
          setStage('COMPLETED');
          setStatusMessage('Conversion completed successfully!');
          setOutputFileName(statusData.outputFileName || 'converted_document');
        } else if (statusData.status === 'FAILED') {
          clearInterval(pollingRef.current);
          setStage('FAILED');
          setErrorMessage(statusData.errorMessage || 'Conversion failed.');
        } else if (statusData.status === 'CANCELLED') {
          clearInterval(pollingRef.current);
          setStage('FAILED');
          setErrorMessage('Conversion job was cancelled.');
        }
      } catch (pollErr) {
        // Keep polling briefly in case of temporary blip
      }
    }, 1000);
  };

  const downloadOutput = async () => {
    if (!jobId) return;
    await conversionService.downloadResult(jobId, outputFileName);
  };

  const reset = () => {
    removeFile();
  };

  return {
    selectedFile,
    stage,
    progress,
    statusMessage,
    errorMessage,
    jobId,
    outputFileName,
    selectFile,
    removeFile,
    startProcess,
    downloadOutput,
    reset
  };
}
