// 전역 변수
let playlists = [];
let showHidden = false;
let apiKey = localStorage.getItem('openai_api_key') || '';
let currentMatchedId = null;

// 응원 메시지 배열
const encouragementMessages = [
    "화이팅! AI도 달리고 있어요, 당신도 할 수 있어요!",
    "멋져요! 계속 달려나가세요! 🏃‍♂️💨",
    "집중력 MAX! 당신은 최고예요!",
    "쉬지 않고 달리는 AI처럼, 멈추지 마세요!",
    "훌륭해요! 이 페이스를 유지하세요!",
    "당신의 노력이 빛나고 있어요! ✨",
    "포기하지 마세요! 거의 다 왔어요!",
    "끝까지 달려봐요! 당신은 할 수 있어요!"
];

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // API 키 확인
    if (!apiKey) {
        showApiKeyModal();
    }

    // 플레이리스트 로드
    await loadPlaylists();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 플레이리스트 렌더링
    renderPlaylists();
});

// API 키 모달 표시
function showApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    modal.classList.add('show');
}

// API 키 모달 숨기기
function hideApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    modal.classList.remove('show');
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // API 키 저장
    document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
        const input = document.getElementById('apiKeyInput');
        const key = input.value.trim();
        if (key) {
            apiKey = key;
            localStorage.setItem('openai_api_key', key);
            hideApiKeyModal();
            showNotification('API 키가 저장되었습니다!');
        } else {
            alert('유효한 API 키를 입력해주세요.');
        }
    });

    // API 키 건너뛰기
    document.getElementById('skipApiKeyBtn').addEventListener('click', () => {
        hideApiKeyModal();
        showNotification('AI 매칭 없이 진행합니다. 키워드는 기본 매칭으로 동작합니다.');
    });

    // 매칭 버튼
    document.getElementById('matchButton').addEventListener('click', handleMatch);

    // Enter 키로 매칭
    document.getElementById('keywordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleMatch();
        }
    });

    // 숨김 보기 토글
    document.getElementById('toggleHiddenBtn').addEventListener('click', toggleHiddenPlaylists);
}

// 플레이리스트 로드
async function loadPlaylists() {
    try {
        const response = await fetch('playlists.json');
        const data = await response.json();

        // localStorage에서 숨김 상태 복원
        const hiddenState = JSON.parse(localStorage.getItem('hidden_playlists') || '{}');
        playlists = data.map(playlist => ({
            ...playlist,
            hidden: hiddenState[playlist.id] || false
        }));
    } catch (error) {
        console.error('플레이리스트 로드 실패:', error);
        showNotification('플레이리스트를 불러오는데 실패했습니다.');
    }
}

// 플레이리스트 렌더링
function renderPlaylists() {
    const container = document.getElementById('playlistContainer');
    container.innerHTML = '';

    const visiblePlaylists = showHidden
        ? playlists
        : playlists.filter(p => !p.hidden);

    if (visiblePlaylists.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">표시할 플레이리스트가 없습니다.</p>';
        return;
    }

    visiblePlaylists.forEach(playlist => {
        const card = createPlaylistCard(playlist);
        container.appendChild(card);
    });
}

// 플레이리스트 카드 생성
function createPlaylistCard(playlist) {
    const card = document.createElement('div');
    card.className = 'playlist-card';
    if (playlist.hidden) {
        card.classList.add('hidden-playlist');
    }
    if (playlist.id === currentMatchedId) {
        card.classList.add('matched');
    }

    const statusBadge = playlist.id === currentMatchedId
        ? '<span class="playlist-status matched-badge">✨ 추천</span>'
        : playlist.hidden
            ? '<span class="playlist-status hidden-badge">숨김</span>'
            : '';

    const actionButton = playlist.hidden
        ? '<button class="btn-restore" onclick="restorePlaylist(' + playlist.id + ')">복원</button>'
        : '<button class="btn-remove" onclick="hidePlaylist(' + playlist.id + ')">제거</button>';

    card.innerHTML = `
        <div class="playlist-header">
            <div class="playlist-name">${playlist.name}</div>
            ${statusBadge}
        </div>
        <div class="playlist-description">${playlist.description}</div>
        <div class="playlist-keywords">
            ${playlist.keywords.map(kw => `<span class="keyword-tag">#${kw}</span>`).join('')}
        </div>
        <div class="playlist-actions">
            <a href="${playlist.link}" target="_blank" class="playlist-link">재생하기 🎵</a>
            ${actionButton}
        </div>
    `;

    return card;
}

// 플레이리스트 숨기기
function hidePlaylist(id) {
    const playlist = playlists.find(p => p.id === id);
    if (playlist) {
        playlist.hidden = true;
        saveHiddenState();
        renderPlaylists();
        showNotification('플레이리스트가 숨겨졌습니다.');
    }
}

// 플레이리스트 복원
function restorePlaylist(id) {
    const playlist = playlists.find(p => p.id === id);
    if (playlist) {
        playlist.hidden = false;
        saveHiddenState();
        renderPlaylists();
        showNotification('플레이리스트가 복원되었습니다.');
    }
}

// 숨김 상태 저장
function saveHiddenState() {
    const hiddenState = {};
    playlists.forEach(p => {
        if (p.hidden) {
            hiddenState[p.id] = true;
        }
    });
    localStorage.setItem('hidden_playlists', JSON.stringify(hiddenState));
}

// 숨김 보기 토글
function toggleHiddenPlaylists() {
    showHidden = !showHidden;
    const toggleText = document.getElementById('toggleHiddenText');
    toggleText.textContent = showHidden ? '숨김 숨기기' : '숨김 보기';
    renderPlaylists();
}

// 매칭 처리
async function handleMatch() {
    const input = document.getElementById('keywordInput');
    const keyword = input.value.trim();

    if (!keyword) {
        alert('키워드를 입력해주세요!');
        return;
    }

    // 로딩 표시
    showLoading(true);
    hideResult();
    hideEncouragement();

    try {
        let matchedPlaylist;

        if (apiKey) {
            // OpenAI API를 사용한 스마트 매칭
            matchedPlaylist = await matchWithAI(keyword);
        } else {
            // 기본 키워드 매칭
            matchedPlaylist = matchWithKeywords(keyword);
        }

        // 결과 표시
        showLoading(false);

        if (matchedPlaylist) {
            currentMatchedId = matchedPlaylist.id;
            showEncouragement();
            showResult(matchedPlaylist);
            renderPlaylists();
        } else {
            showNotification('매칭되는 플레이리스트를 찾지 못했습니다. 다른 키워드를 시도해보세요!');
        }
    } catch (error) {
        console.error('매칭 실패:', error);
        showLoading(false);
        showNotification('매칭 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// AI 기반 매칭
async function matchWithAI(keyword) {
    try {
        const playlistsInfo = playlists
            .filter(p => !p.hidden)
            .map(p => ({
                id: p.id,
                name: p.name,
                keywords: p.keywords,
                description: p.description
            }));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '당신은 학습 플레이리스트 추천 전문가입니다. 사용자의 학습 키워드에 가장 적합한 플레이리스트를 선택해주세요.'
                    },
                    {
                        role: 'user',
                        content: `사용자 키워드: "${keyword}"\n\n사용 가능한 플레이리스트:\n${JSON.stringify(playlistsInfo, null, 2)}\n\n가장 적합한 플레이리스트의 ID만 숫자로 답변해주세요.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 50
            })
        });

        if (!response.ok) {
            throw new Error('API 호출 실패');
        }

        const data = await response.json();
        const playlistId = parseInt(data.choices[0].message.content.trim());

        return playlists.find(p => p.id === playlistId);
    } catch (error) {
        console.error('AI 매칭 실패:', error);
        // AI 실패 시 기본 매칭으로 폴백
        return matchWithKeywords(keyword);
    }
}

// 키워드 기반 매칭
function matchWithKeywords(keyword) {
    const lowerKeyword = keyword.toLowerCase();

    // 숨기지 않은 플레이리스트만 대상
    const availablePlaylists = playlists.filter(p => !p.hidden);

    // 키워드가 정확히 일치하는 플레이리스트 찾기
    let matched = availablePlaylists.find(p =>
        p.keywords.some(kw => kw.toLowerCase() === lowerKeyword)
    );

    // 정확한 일치가 없으면 부분 일치 검색
    if (!matched) {
        matched = availablePlaylists.find(p =>
            p.keywords.some(kw => kw.toLowerCase().includes(lowerKeyword)) ||
            p.name.toLowerCase().includes(lowerKeyword) ||
            p.description.toLowerCase().includes(lowerKeyword)
        );
    }

    // 그래도 없으면 첫 번째 플레이리스트 반환
    if (!matched && availablePlaylists.length > 0) {
        matched = availablePlaylists[0];
    }

    return matched;
}

// 응원 메시지 표시
function showEncouragement() {
    const encouragement = document.getElementById('encouragementMessage');
    const text = document.querySelector('.encouragement-text');

    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    text.textContent = randomMessage;

    encouragement.classList.remove('hidden');
}

// 응원 메시지 숨기기
function hideEncouragement() {
    const encouragement = document.getElementById('encouragementMessage');
    encouragement.classList.add('hidden');
}

// 결과 표시
function showResult(playlist) {
    const resultSection = document.getElementById('resultSection');
    const matchedPlaylist = document.getElementById('matchedPlaylist');

    matchedPlaylist.innerHTML = `
        <div class="playlist-card matched">
            <div class="playlist-header">
                <div class="playlist-name">${playlist.name}</div>
                <span class="playlist-status matched-badge">✨ 최적 매칭</span>
            </div>
            <div class="playlist-description">${playlist.description}</div>
            <div class="playlist-keywords">
                ${playlist.keywords.map(kw => `<span class="keyword-tag">#${kw}</span>`).join('')}
            </div>
            <div class="playlist-actions">
                <a href="${playlist.link}" target="_blank" class="playlist-link">재생하기 🎵</a>
            </div>
        </div>
    `;

    resultSection.classList.remove('hidden');

    // 결과로 스크롤
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 결과 숨기기
function hideResult() {
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.add('hidden');
    currentMatchedId = null;
}

// 로딩 표시
function showLoading(show) {
    const loading = document.getElementById('loadingIndicator');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// 알림 표시
function showNotification(message) {
    // 간단한 알림 (필요시 더 예쁘게 만들 수 있음)
    alert(message);
}
