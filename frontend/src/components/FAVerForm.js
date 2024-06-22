import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { pdfjs } from 'react-pdf';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import './FAVerForm.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RemarkPopup from './RemarkPopup';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

pdfjs.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + '/pdf.worker.min.js';

const FAVerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileNoFromUrl = new URLSearchParams(location.search).get('fileNo');
  const [formData, setFormData] = useState({
    FAV_FileNo: fileNoFromUrl || '',
    FAV_VendorName: '',
    FAV_CaseStatus: '',
    FAV_VerSecName: '',
    FAV_VerParamName: ''
  });

  const [readOnly, setReadOnly] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const caseSectionRef = useRef(null);
  const fileInputRef = useRef(null);
  const username = localStorage.getItem('username');
  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton } = zoomPluginInstance;
  const [isRemarkPopupOpen, setRemarkPopupOpen] = useState(false);
  const [remarkParamName, setRemarkParamName] = useState('');
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    if (fileNoFromUrl) {
      const pdfUrl = `http://localhost:5000/pdf-files/${fileNoFromUrl}.pdf`;
      console.log('PDF URL:', pdfUrl);
      setPdfFile(pdfUrl);
    }
  }, [fileNoFromUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setPdfFile(fileUrl);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { FAV_VerSecName, FAV_VerParamName, ...dataToSubmit } = formData;

    axios.post('http://localhost:5000/api/save-form-and-fetch-section', dataToSubmit)
      .then(response => {
        toast.success('Form saved successfully!');
        setReadOnly(true);
        setFormData({
          ...formData,
          FAV_VerSecName: response.data.sectionName,
          FAV_VerParamName: response.data.paramName
        });
        if (caseSectionRef.current) {
          caseSectionRef.current.focus();
        }
        console.log('Form submitted and response received:', response.data);
      })
      .catch(error => {
        console.error('Error saving form and fetching section:', error);
        toast.error('Error saving form and fetching section. Please try again.');
      });
  };

  const handleClear = () => {
    setFormData({
      FAV_FileNo: '',
      FAV_VendorName: '',
      FAV_CaseStatus: '',
      FAV_VerSecName: "",
      FAV_VerParamName: ""
    });

    if (pdfFile) {
      URL.revokeObjectURL(pdfFile);
      setPdfFile(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setReadOnly(false);
    console.log('Form cleared');
  };

  const handleNext = () => {
    const currentParam = formData.FAV_VerParamName;

    axios.get(`http://localhost:5000/api/next-parameter?currentParam=${encodeURIComponent(currentParam)}`)
      .then(response => {
        setFormData({
          ...formData,
          FAV_VerSecName: response.data.sectionName,
          FAV_VerParamName: response.data.paramName
        });
      })
      .catch(error => {
        console.error('Error fetching next parameter:', error);
        toast.error('Error fetching next parameter. Please try again.');
      });
  };

  const handleBack = () => {
    const currentParam = formData.FAV_VerParamName;

    axios.get(`http://localhost:5000/api/back-parameter?currentParam=${encodeURIComponent(currentParam)}`)
      .then(response => {
        setFormData({
          ...formData,
          FAV_VerSecName: response.data.sectionName,
          FAV_VerParamName: response.data.paramName
        });
      })
      .catch(error => {
        console.error('Error fetching next parameter:', error);
        toast.error('Error fetching next parameter. Please try again.');
      });
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString();
  };

  return (
    <div className="page-container">
      <header>
        <div className="user-info">User: {username}</div>
        <div className="buttons"><button type="button" onClick={() => navigate('/verification')}>Back to Dashboard</button></div>
        <div className="date-time">{getCurrentDateTime()}</div>
      </header>
      <div className="split-screen">
        <div className="left-side">
          <h3><u>Case Verification</u></h3>
          <form onSubmit={handleSubmit} className="form-container">
            <div className="form-group">
              <label htmlFor="FAV_FileNo">Form No:</label>
              <input type="text" id="FAV_FileNo" name="FAV_FileNo" value={formData.FAV_FileNo} onChange={handleInputChange} disabled={readOnly} required />
            </div>
            <div className="form-group">
              <label htmlFor="FAV_VendorName">Client Name:</label>
              <input type="text" id="FAV_VendorName" name="FAV_VendorName" value={formData.FAV_VendorName} onChange={handleInputChange} disabled={readOnly} required />
            </div>
            <div className="form-group">
              <label htmlFor="FAV_CaseStatus">Case Status:</label>
              <select id="FAV_CaseStatus" name="FAV_CaseStatus" value={formData.FAV_CaseStatus} onChange={handleInputChange} disabled={readOnly} required>
                <option value="">== Select ==</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div className="buttons">
              <button type="submit" disabled={readOnly}>Start Verification</button>
              <button type="button" onClick={handleClear}>Clear Form</button>
            </div>
          </form>
          <br></br><hr></hr><br></br>
          <div className="form-group-param">
            <label>Section:</label>
            <input type="text" name="FAV_VerSecName" value={formData.FAV_VerSecName} disabled readOnly />
          </div>
          <div className="form-group-param">
            <label>Parameter :</label>
            <textarea name="FAV_VerParamName" value={formData.FAV_VerParamName} disabled readOnly />
          </div>
          <div className="buttons">
            <button type="button" onClick={handleBack} title="Back">&lt;&lt;</button>
            <button type="button" onClick={() => {
              setRemarkParamName(formData.FAV_VerParamName);
              setRemarkPopupOpen(true);
            }}>Add Remark</button>
            <button type="button" onClick={handleNext} title="Next">&gt;&gt;</button>
          </div>
        </div>
        <div className="right-side">
          <input type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} />
          {pdfFile && (
            <Worker workerUrl="pdf.worker.min.js">
              {/*<div className="pdf-controls">
                <ZoomInButton />
                <ZoomOutButton />
              </div>
              <Viewer
                fileUrl={pdfFile}
                plugins={[zoomPluginInstance]}
                defaultScale={SpecialZoomLevel.PageWidth}
              />*/}
                <div className="pdf-controls">
                    <zoomPluginInstance.ZoomInButton />
                    <zoomPluginInstance.ZoomOutButton />
                </div>
                <Viewer
                    fileUrl={pdfFile}
                    plugins={[zoomPluginInstance, defaultLayoutPluginInstance]}
                    defaultScale={SpecialZoomLevel.PageWidth}
                />
            </Worker>
          )}
        </div>
      </div>
      <ToastContainer />
      <RemarkPopup
        isOpen={isRemarkPopupOpen}
        parameterName={remarkParamName}
        FileNo={formData.FAV_FileNo}
        VendorName={formData.FAV_VendorName}
        CaseStatus={formData.FAV_CaseStatus}
        Section={formData.FAV_VerSecName}
        user={username}
        onClose={() => setRemarkPopupOpen(false)}
      />
    </div>
  );
};

export default FAVerForm;
