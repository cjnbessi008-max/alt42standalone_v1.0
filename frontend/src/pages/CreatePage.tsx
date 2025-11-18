import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropositionEditor from '../components/PropositionEditor/PropositionEditor';
import { CreatePropositionRequest } from '../types';
import { propositionsApi } from '../services/api';
import './CreatePage.css';

const CreatePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: CreatePropositionRequest) => {
    try {
      const created = await propositionsApi.create(data);
      navigate(`/proposition/${created.id}`);
    } catch (err) {
      alert('명제 생성에 실패했습니다.');
      console.error(err);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="create-page">
      <PropositionEditor onSubmit={handleSubmit} onCancel={handleCancel} />
    </div>
  );
};

export default CreatePage;
