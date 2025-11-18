import React from 'react';
import { EquationParams } from '../types/equation.types';
import { useEquationStore } from '../store/equationStore';

const EquationInput: React.FC = () => {
  const { equation, updateParameter } = useEquationStore();

  const handleSliderChange = (param: keyof EquationParams, value: number) => {
    updateParameter(param, value);
  };

  const renderControls = () => {
    switch (equation.type) {
      case 'linear':
        return (
          <>
            <SliderControl
              label="기울기 (a)"
              param="a"
              value={equation.a ?? 1}
              min={-5}
              max={5}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="y절편 (b)"
              param="b"
              value={equation.b ?? 0}
              min={-10}
              max={10}
              step={0.5}
              onChange={handleSliderChange}
            />
          </>
        );

      case 'quadratic':
        return (
          <>
            <SliderControl
              label="a (이차계수)"
              param="a"
              value={equation.a ?? 1}
              min={-3}
              max={3}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="b (일차계수)"
              param="b"
              value={equation.b ?? 0}
              min={-5}
              max={5}
              step={0.5}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="c (상수)"
              param="c"
              value={equation.c ?? 0}
              min={-10}
              max={10}
              step={0.5}
              onChange={handleSliderChange}
            />
          </>
        );

      case 'circle':
        return (
          <>
            <SliderControl
              label="중심 x (h)"
              param="h"
              value={equation.h ?? 0}
              min={-5}
              max={5}
              step={0.5}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="중심 y (k)"
              param="k"
              value={equation.k ?? 0}
              min={-5}
              max={5}
              step={0.5}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="반지름 (r)"
              param="r"
              value={equation.r ?? 1}
              min={0.5}
              max={5}
              step={0.5}
              onChange={handleSliderChange}
            />
          </>
        );

      case 'sine':
      case 'cosine':
        return (
          <>
            <SliderControl
              label="진폭 (a)"
              param="a"
              value={equation.a ?? 1}
              min={0.5}
              max={3}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="주기 계수 (b)"
              param="b"
              value={equation.b ?? 1}
              min={0.5}
              max={3}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="위상 (c)"
              param="c"
              value={equation.c ?? 0}
              min={-3.14}
              max={3.14}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="수직이동 (d)"
              param="d"
              value={equation.d ?? 0}
              min={-3}
              max={3}
              step={0.1}
              onChange={handleSliderChange}
            />
          </>
        );

      case 'exponential':
        return (
          <>
            <SliderControl
              label="계수 (a)"
              param="a"
              value={equation.a ?? 1}
              min={0.1}
              max={3}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="지수 계수 (b)"
              param="b"
              value={equation.b ?? 1}
              min={-2}
              max={2}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="수직이동 (c)"
              param="c"
              value={equation.c ?? 0}
              min={-5}
              max={5}
              step={0.5}
              onChange={handleSliderChange}
            />
          </>
        );

      case 'logarithm':
        return (
          <>
            <SliderControl
              label="계수 (a)"
              param="a"
              value={equation.a ?? 1}
              min={0.1}
              max={3}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="로그 계수 (b)"
              param="b"
              value={equation.b ?? 1}
              min={0.1}
              max={3}
              step={0.1}
              onChange={handleSliderChange}
            />
            <SliderControl
              label="수직이동 (c)"
              param="c"
              value={equation.c ?? 0}
              min={-5}
              max={5}
              step={0.5}
              onChange={handleSliderChange}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">매개변수 조절</h3>
      {renderControls()}
    </div>
  );
};

interface SliderControlProps {
  label: string;
  param: keyof EquationParams;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (param: keyof EquationParams, value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  param,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <span className="text-xs font-mono bg-blue-50 px-2 py-1 rounded">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(param, parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );
};

export default EquationInput;
