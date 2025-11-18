import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FocusSettings as FocusSettingsType } from '../../types';
import { focusApi } from '../../services/api';

interface FocusSettingsProps {
  userId: number;
  onClose: () => void;
}

const FocusSettings: React.FC<FocusSettingsProps> = ({ userId, onClose }) => {
  const [settings, setSettings] = useState<FocusSettingsType>({
    blur_intensity: 5,
    dim_opacity: 70,
    hide_timer: false,
    hide_score: false,
    hide_navigation: false,
    fullscreen_mode: true,
    sound_enabled: false,
    theme: 'auto'
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const response = await focusApi.getSettings(userId);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      await focusApi.updateSettings(userId, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('설정을 초기화하시겠습니까?')) {
      try {
        await focusApi.resetSettings(userId);
        await loadSettings();
        alert('설정이 초기화되었습니다.');
      } catch (error) {
        console.error('Failed to reset settings:', error);
        alert('설정 초기화에 실패했습니다.');
      }
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>🎯 집중 모드 설정</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>

        <Content>
          <SettingsGroup>
            <GroupTitle>시각 효과</GroupTitle>

            <Setting>
              <SettingLabel>
                <span>블러 강도</span>
                <SettingValue>{settings.blur_intensity}</SettingValue>
              </SettingLabel>
              <Slider
                type="range"
                min="0"
                max="10"
                value={settings.blur_intensity}
                onChange={e => setSettings({ ...settings, blur_intensity: parseInt(e.target.value) })}
              />
              <SliderLabels>
                <span>약함</span>
                <span>강함</span>
              </SliderLabels>
            </Setting>

            <Setting>
              <SettingLabel>
                <span>화면 어둡기</span>
                <SettingValue>{settings.dim_opacity}%</SettingValue>
              </SettingLabel>
              <Slider
                type="range"
                min="0"
                max="100"
                value={settings.dim_opacity}
                onChange={e => setSettings({ ...settings, dim_opacity: parseInt(e.target.value) })}
              />
              <SliderLabels>
                <span>밝음</span>
                <span>어두움</span>
              </SliderLabels>
            </Setting>
          </SettingsGroup>

          <SettingsGroup>
            <GroupTitle>표시 옵션</GroupTitle>

            <ToggleSetting>
              <ToggleLabel>타이머 숨기기</ToggleLabel>
              <Toggle
                $active={settings.hide_timer}
                onClick={() => setSettings({ ...settings, hide_timer: !settings.hide_timer })}
              >
                <ToggleSwitch $active={settings.hide_timer} />
              </Toggle>
            </ToggleSetting>

            <ToggleSetting>
              <ToggleLabel>점수 숨기기</ToggleLabel>
              <Toggle
                $active={settings.hide_score}
                onClick={() => setSettings({ ...settings, hide_score: !settings.hide_score })}
              >
                <ToggleSwitch $active={settings.hide_score} />
              </Toggle>
            </ToggleSetting>

            <ToggleSetting>
              <ToggleLabel>네비게이션 숨기기</ToggleLabel>
              <Toggle
                $active={settings.hide_navigation}
                onClick={() => setSettings({ ...settings, hide_navigation: !settings.hide_navigation })}
              >
                <ToggleSwitch $active={settings.hide_navigation} />
              </Toggle>
            </ToggleSetting>

            <ToggleSetting>
              <ToggleLabel>전체화면 모드</ToggleLabel>
              <Toggle
                $active={settings.fullscreen_mode}
                onClick={() => setSettings({ ...settings, fullscreen_mode: !settings.fullscreen_mode })}
              >
                <ToggleSwitch $active={settings.fullscreen_mode} />
              </Toggle>
            </ToggleSetting>

            <ToggleSetting>
              <ToggleLabel>효과음 활성화</ToggleLabel>
              <Toggle
                $active={settings.sound_enabled}
                onClick={() => setSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
              >
                <ToggleSwitch $active={settings.sound_enabled} />
              </Toggle>
            </ToggleSetting>
          </SettingsGroup>

          <SettingsGroup>
            <GroupTitle>테마</GroupTitle>
            <ThemeOptions>
              <ThemeOption
                $active={settings.theme === 'light'}
                onClick={() => setSettings({ ...settings, theme: 'light' })}
              >
                ☀️ 라이트
              </ThemeOption>
              <ThemeOption
                $active={settings.theme === 'dark'}
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
              >
                🌙 다크
              </ThemeOption>
              <ThemeOption
                $active={settings.theme === 'auto'}
                onClick={() => setSettings({ ...settings, theme: 'auto' })}
              >
                🔄 자동
              </ThemeOption>
            </ThemeOptions>
          </SettingsGroup>
        </Content>

        <Footer>
          <ResetButton onClick={handleReset}>초기화</ResetButton>
          <SaveButton onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
          </SaveButton>
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default FocusSettings;

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #e0e0e0;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 2rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;

  &:hover {
    background: #f0f0f0;
    color: #333;
  }
`;

const Content = styled.div`
  padding: 2rem;
`;

const SettingsGroup = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const GroupTitle = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
`;

const Setting = styled.div`
  margin-bottom: 1.5rem;
`;

const SettingLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 1rem;
  color: #333;
`;

const SettingValue = styled.span`
  font-weight: bold;
  color: #667eea;
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    cursor: pointer;
    border: none;
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #999;
`;

const ToggleSetting = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const ToggleLabel = styled.span`
  font-size: 1rem;
  color: #333;
`;

const Toggle = styled.div<{ $active: boolean }>`
  width: 52px;
  height: 28px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc'};
  border-radius: 14px;
  padding: 3px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
`;

const ToggleSwitch = styled.div<{ $active: boolean }>`
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s;
  transform: translateX(${props => props.$active ? '24px' : '0'});
`;

const ThemeOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

const ThemeOption = styled.button<{ $active: boolean }>`
  padding: 1rem;
  background: ${props => props.$active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5'};
  color: ${props => props.$active ? 'white' : '#333'};
  border: 2px solid ${props => props.$active ? '#667eea' : '#e0e0e0'};
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2rem;
  border-top: 1px solid #e0e0e0;
  gap: 1rem;
`;

const ResetButton = styled.button`
  padding: 1rem 2rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #d32f2f;
  }
`;

const SaveButton = styled.button`
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;
