import React, { useState } from 'react';
import { CreatePropositionRequest, PropositionType } from '../../types';
import './PropositionEditor.css';

interface PropositionEditorProps {
  onSubmit: (data: CreatePropositionRequest) => void;
  onCancel?: () => void;
  initialData?: Partial<CreatePropositionRequest>;
}

const PropositionEditor: React.FC<PropositionEditorProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreatePropositionRequest>({
    title: initialData?.title || '',
    statement: initialData?.statement || '',
    domain: initialData?.domain || '',
    type: initialData?.type || 'universal',
    truthValue: initialData?.truthValue,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTruthValueChange = (value: boolean | null) => {
    setFormData((prev) => ({ ...prev, truthValue: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="proposition-editor" onSubmit={handleSubmit}>
      <h2>{initialData ? '명제 수정' : '새 명제 만들기'}</h2>

      <div className="form-group">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="예: 모든 소수는 홀수다"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="statement">명제 (논리식)</label>
        <textarea
          id="statement"
          name="statement"
          value={formData.statement}
          onChange={handleChange}
          placeholder="예: ∀x ∈ Primes, x is odd"
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="domain">정의역</label>
        <input
          id="domain"
          name="domain"
          type="text"
          value={formData.domain}
          onChange={handleChange}
          placeholder="예: Prime numbers"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="type">명제 유형</label>
        <select id="type" name="type" value={formData.type} onChange={handleChange} required>
          <option value="universal">전칭 명제 (∀)</option>
          <option value="existential">존재 명제 (∃)</option>
          <option value="conditional">조건 명제 (→)</option>
          <option value="biconditional">쌍조건 명제 (↔)</option>
        </select>
      </div>

      <div className="form-group">
        <label>진리값</label>
        <div className="truth-value-buttons">
          <button
            type="button"
            className={formData.truthValue === true ? 'active' : ''}
            onClick={() => handleTruthValueChange(true)}
          >
            참 (True)
          </button>
          <button
            type="button"
            className={formData.truthValue === false ? 'active' : ''}
            onClick={() => handleTruthValueChange(false)}
          >
            거짓 (False)
          </button>
          <button
            type="button"
            className={formData.truthValue === null ? 'active' : ''}
            onClick={() => handleTruthValueChange(null)}
          >
            미정
          </button>
        </div>
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            취소
          </button>
        )}
        <button type="submit" className="btn-submit">
          {initialData ? '수정' : '생성'}
        </button>
      </div>
    </form>
  );
};

export default PropositionEditor;
