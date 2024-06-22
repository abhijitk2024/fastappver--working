import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RemarkPopup.css';
import { toast } from 'react-toastify';

const RemarkPopup = ({ isOpen, onClose, parameterName, FileNo, VendorName, CaseStatus, Section, user }) => {
  const [description, setDescription] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (isOpen && parameterName) {
      axios.get(`http://localhost:5000/api/parameter-description?param=${encodeURIComponent(parameterName)}`)
        .then(response => {
          if (response.data.description) {
            setDescription(response.data.description);
          } else {
            console.error('Description not found in response:', response.data);
          }
        })
        .catch(error => {
          console.error('Error fetching parameter description:', error);
        });
    }
  }, [isOpen, parameterName]);

  const handleSave = () => {
    // Validate all required fields
    if (!FileNo || !VendorName || !CaseStatus || !Section || !parameterName || !user) {
      toast.error('All fields must be filled out.');
      return;
    }

    if (remark.trim() === '') {
      toast.error('Please enter a remark before saving.');
      return;
    }

    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    axios.post('http://localhost:5000/api/save-remark', {
      FileNo,
      VendorName,
      CaseStatus,
      Section,
      parameterName,
      remark,
      user,
      date: currentDate
    })
    .then(response => {
      toast.success('Remark saved successfully!');
      onClose();
    })
    .catch(error => {
      console.error('Error saving remark:', error);
      toast.error('Error saving remark. Please try again.');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="remark-popup">
      <div className="remark-popup-content">
        <h3>Parameter Description</h3>
        <div className="description-banner">{description}</div>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Enter your remark here"
        />
        <div className="popup-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default RemarkPopup;
