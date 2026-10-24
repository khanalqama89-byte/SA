import { useState, useRef, useEffect } from 'react';
import { conversionService } from '../services/conversionService';
import { convertPdfToImagesClient } from '../services/clientPdfConverter';

export function useConversion(toolSlug) {
  const [selectedFile, setSelectedFile] = useState(null);
  // 'IDLE' | 'PREVIEW' | 'CONVERTING' | 'COMPLETED' | 'FAILED'
  const [stage, setStage] = useState('IDLE');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [outputFileName, setOutputFileName] = useState('');
  const [resultData, setResultData] = useState(null);

  const pollingRef = useRef(null);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const selectFile = (file) => {
    setSelectedFile(file);
    setStage('PREVIEW');
    setProgress(0);
    setErrorMessage(null);
    setJobId(null);
    setOutputFileName('');
    setResultData(null);
  };

  const replaceFile = (file) => {
    selectFile(file);
  };

  const removeFile = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setSelectedFile(null);
    setStage('IDLE');
    setProgress(0);
    setErrorMessage(null);
    setJobId(null);
    setOutputFileName('');
    setResultData(null);
  };

  const startProcess = async (options = {}) => {
    if (!selectedFile) return;

    try {
      setErrorMessage(null);
      setStage('CONVERTING');
      setProgress(15);
      setStatusMessage('Preparing your file...');

      // Dynamic progress messages to reflect active processing
      let currentProgress = 20;
      progressTimerRef.current = setInterval(() => {
        currentProgress += 10;
        if (currentProgress === 35) {
          setStatusMessage('Analyzing document structure...');
        } else if (currentProgress === 65) {
          setStatusMessage('Converting layout and formatting...');
        } else if (currentProgress === 85) {
          setStatusMessage('Finalizing your document...');
        }
        if (currentProgress < 90) {
          setProgress(currentProgress);
        }
      }, 350);

      // High-Fidelity Client-Side Rendering for PDF to Image (guarantees crisp fonts and real JPEG/PNG files)
      if (['pdf-to-jpg', 'pdf-to-png'].includes(toolSlug)) {
        try {
          const clientResult = await convertPdfToImagesClient(selectedFile, toolSlug, options);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          setProgress(100);
          setStatusMessage('Images generated successfully!');
          setStage('COMPLETED');
          const clientJobId = 'client_' + Date.now();
          setJobId(clientJobId);
          setOutputFileName(clientResult.outputFileName);
          setResultData({
            originalFileName: selectedFile.name,
            originalSize: selectedFile.size,
            outputFileName: clientResult.outputFileName,
            targetFormat: clientResult.targetFormat,
            sourceFormat: 'pdf',
            size: clientResult.size,
            mimeType: clientResult.mimeType,
            fileBase64: clientResult.fileBase64,
            downloadUrl: '#'
          });
          return;
        } catch (clientErr) {
          console.warn('Client-side rendering fallback to server:', clientErr);
        }
      }

      const resData = await conversionService.startDirectConversion(toolSlug, selectedFile, options);

      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      if (resData && resData.status === 'COMPLETED') {
        setProgress(100);
        setStatusMessage('Conversion completed successfully!');
        setStage('COMPLETED');
        setJobId(resData.jobId);
        setOutputFileName(resData.outputFileName || 'converted_document');
        setResultData({
          originalFileName: resData.originalFileName || selectedFile.name,
          originalSize: resData.originalSize || selectedFile.size,
          outputFileName: resData.outputFileName,
          targetFormat: resData.targetFormat,
          sourceFormat: resData.sourceFormat,
          size: resData.size,
          mimeType: resData.mimeType,
          fileBase64: resData.fileBase64,
          downloadUrl: resData.downloadUrl
        });
      } else if (resData && resData.jobId) {
        setJobId(resData.jobId);
        setStatusMessage('Converting document...');
        pollJobStatus(resData.jobId);
      } else {
        throw new Error('Unexpected response received from converter engine.');
      }
    } catch (err) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setStage('FAILED');
      setErrorMessage(
        err.message?.includes('password')
          ? 'This file appears to be password-protected. Please unlock it and try again.'
          : err.message || 'Unable to convert this file. Please check format and try another document.'
      );
    }
  };

  const pollJobStatus = (targetJobId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const statusData = await conversionService.getJobStatus(targetJobId);

        if (statusData.status === 'PROCESSING') {
          setStatusMessage('Finalizing your document...');
        } else if (statusData.status === 'COMPLETED') {
          clearInterval(pollingRef.current);
          setProgress(100);
          setStage('COMPLETED');
          setStatusMessage('Conversion completed successfully!');
          setOutputFileName(statusData.outputFileName || 'converted_document');
          setResultData({
            outputFileName: statusData.outputFileName,
            targetFormat: toolSlug.split('-').pop(),
            originalFileName: selectedFile?.name,
            originalSize: selectedFile?.size
          });
        } else if (statusData.status === 'FAILED') {
          clearInterval(pollingRef.current);
          setStage('FAILED');
          setErrorMessage(statusData.errorMessage || 'Conversion failed. Please try another file.');
        } else if (statusData.status === 'CANCELLED') {
          clearInterval(pollingRef.current);
          setStage('FAILED');
          setErrorMessage('Conversion was cancelled.');
        }
      } catch (pollErr) {
        // Keep polling briefly in case of temporary latency
      }
    }, 1000);
  };

  const downloadOutput = async () => {
    if (!jobId) return;
    await conversionService.downloadResult(
      jobId,
      outputFileName,
      resultData?.fileBase64,
      resultData?.mimeType
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
    resultData,
    selectFile,
    replaceFile,
    removeFile,
    startProcess,
    downloadOutput,
    reset
  };
}
