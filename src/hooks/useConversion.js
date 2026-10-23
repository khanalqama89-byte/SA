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
  const [cachedResult, setCachedResult] = useState(null); // { base64, mimeType }

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
    setCachedResult(null);
  };

  const removeFile = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedFile(null);
    setStage('IDLE');
    setProgress(0);
    setErrorMessage(null);
    setJobId(null);
    setOutputFileName('');
    setCachedResult(null);
  };

  const startProcess = async (options = {}) => {
    if (!selectedFile) return;

    try {
      setErrorMessage(null);
      setStage('CONVERTING');
      setStatusMessage('Sending document to SA Engine...');
      setProgress(25);

      // Perform direct conversion (instant serverless roundtrip)
      const resData = await conversionService.startDirectConversion(toolSlug, selectedFile, options);

      setProgress(85);
      setStatusMessage('Processing completed!');

      if (resData && resData.status === 'COMPLETED') {
        setProgress(100);
        setStage('COMPLETED');
        setStatusMessage('Conversion completed successfully!');
        setJobId(resData.jobId);
        setOutputFileName(resData.outputFileName || 'converted_document');
        setCachedResult({
          base64: resData.fileBase64,
          mimeType: resData.mimeType
        });
      } else if (resData && resData.jobId) {
        // Fallback in case async queue is returned
        setJobId(resData.jobId);
        setStatusMessage('Converting document with SA Engine...');
        pollJobStatus(resData.jobId);
      } else {
        throw new Error('Unexpected response received from converter engine.');
      }
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
    await conversionService.downloadResult(
      jobId,
      outputFileName,
      cachedResult?.base64,
      cachedResult?.mimeType
    );
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
