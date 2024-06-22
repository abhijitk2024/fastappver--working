import React, { useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { useNavigate } from 'react-router-dom';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import axios from 'axios';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import './PDFCoordinateViewer.css';
import { pdfjs } from 'react-pdf';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

pdfjs.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + '/pdf.worker.min.js';

const PDFCoordinateViewer = () => {
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0, pageNumber: 0 });
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const [currentPage, setCurrentPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        sectionRefId: '',
        paramID: '',
        verRefId: '',
        parameterName: '',
        parameterDesc: '',
        rejectCriteria: ''
    });
    const [pdfFile, setPdfFile] = useState(null);

    const zoomPluginInstance = zoomPlugin();
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    const handlePdfClick = (e) => {
        const viewerElement = document.querySelector('.rpv-core__viewer');
        if (!viewerElement) {
            console.warn('Viewer element not found');
            return;
        }

        const rect = viewerElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const pdfX = mouseX / viewerElement.clientWidth;
        const pdfY = mouseY / viewerElement.clientHeight;

        setCoordinates({ x: pdfX, y: pdfY, pageNumber: currentPage });
        setShowForm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { sectionRefId, paramID, verRefId, parameterName, parameterDesc, rejectCriteria } = formData;
        if (!sectionRefId || !paramID || !verRefId || !parameterName || !parameterDesc || !rejectCriteria) {
            toast.error('Please fill in all required fields.');
            return;
        }

        try {
            console.log("inside response")

            const response = await axios.post('http://localhost:5000/save-coordinates', {
                sectionRefId: formData.sectionRefId,
                paramID: formData.paramID,
                verRefId: formData.verRefId,
                parameterName: formData.parameterName,
                parameterDesc: formData.parameterDesc,
                rejectCriteria: formData.rejectCriteria,
                x: coordinates.x,
                y: coordinates.y,
                pageNumber: coordinates.pageNumber,
            });

            if (response.status === 200) {
                console.log("inside response2")
                toast.success('Data saved successfully!', {
                    onClose: () => {
                        setShowForm(false);
                        setFormData({
                            sectionRefId: '',
                            paramID: '',
                            verRefId: '',
                            parameterName: '',
                            parameterDesc: '',
                            rejectCriteria: ''
                        });
                    }
                });
            } else {
                toast.error('Error saving data.');
            }
        } catch (error) {
            console.error('Error saving data:', error);
            toast.error('Error saving data.');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            setPdfFile(fileUrl);
        }
    };

    const getCurrentDateTime = () => {
        const now = new Date();
        return now.toLocaleString();
    };

    return (
        <div className="pdf-viewer-container">
            <header>
                <div className="user-info">Parameter Master Entry Screen</div>
                <div className="buttons">
                    <button type="button" onClick={() => navigate('/landing')}>Back to Dashboard</button>
                </div>
                <div className="date-time">{getCurrentDateTime()}</div>
            </header>
            <br />
            <div className="file-input">
                <label htmlFor="file-upload" className="file-label">Open Form Template PDF:</label>
                <input type="file" id="file-upload" accept="application/pdf" onChange={handleFileChange} />
            </div>

            {pdfFile && (
                <Worker workerUrl={pdfjs.GlobalWorkerOptions.workerSrc}>
                    <div className="pdf-controls">
                        <zoomPluginInstance.ZoomInButton />
                        <zoomPluginInstance.ZoomOutButton />
                    </div>
                    <div className="pdf-viewer" onClick={handlePdfClick}>
                        <Viewer
                            fileUrl={pdfFile}
                            plugins={[zoomPluginInstance, defaultLayoutPluginInstance]}
                            defaultScale={SpecialZoomLevel.PageWidth}
                            onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
                        />
                    </div>
                </Worker>
            )}

            {showForm && (
                <div className="remark-popup">
                    <div className="remark-popup-content">
                        <form className="popup-form" onSubmit={handleSubmit}>
                            <h3>Verification Parameter Input Form</h3>
                            <div className="form-group">
                                <label>Section ID:</label>
                                <input
                                    type="text"
                                    name="sectionRefId"
                                    value={formData.sectionRefId}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Parameter ID:</label>
                                <input
                                    type="text"
                                    name="paramID"
                                    value={formData.paramID}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Verification Ref. ID:</label>
                                <input
                                    type="text"
                                    name="verRefId"
                                    value={formData.verRefId}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Parameter Name:</label>
                                <input
                                    type="text"
                                    name="parameterName"
                                    value={formData.parameterName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Parameter Desc.:</label>
                                <input
                                    type="text"
                                    name="parameterDesc"
                                    value={formData.parameterDesc}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Rejection Criteria:</label>
                                <input
                                    type="text"
                                    name="rejectCriteria"
                                    value={formData.rejectCriteria}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="popup-buttons">
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <ToastContainer />
        </div>
    );
};

export default PDFCoordinateViewer;
