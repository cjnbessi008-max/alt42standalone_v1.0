// 플레이리스트 매칭 앱 - 메인 로직

class PlaylistManager {
    constructor() {
        this.playlists = [];
        this.apiKey = '';
        this.showHidden = false;
        this.init();
    }

    init() {
        // 로컬 스토리지에서 데이터 로드
        this.loadFromLocalStorage();

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 초기 렌더링
        this.renderPlaylists();
        this.updateApiStatus();
    }

    setupEventListeners() {
        // API 키 저장
        document.getElementById('saveApiKeyBtn').addEventListener('click', () => {
            this.saveApiKey();
        });

        // 플레이리스트 추가
        document.getElementById('addPlaylistBtn').addEventListener('click', () => {
            this.addPlaylist();
        });

        // 파일 업로드
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // 키워드 검색
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchByKeyword();
        });

        // 숨김 토글
        document.getElementById('toggleHiddenBtn').addEventListener('click', () => {
            this.toggleHidden();
        });

        // Enter 키 이벤트
        document.getElementById('keywordInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchByKeyword();
            }
        });
    }

    // 로컬 스토리지 관리
    loadFromLocalStorage() {
        const savedApiKey = localStorage.getItem('openai_api_key');
        const savedPlaylists = localStorage.getItem('playlists');

        if (savedApiKey) {
            this.apiKey = savedApiKey;
        }

        if (savedPlaylists) {
            try {
                this.playlists = JSON.parse(savedPlaylists);
            } catch (e) {
                console.error('플레이리스트 로드 오류:', e);
                this.playlists = [];
            }
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('openai_api_key', this.apiKey);
        localStorage.setItem('playlists', JSON.stringify(this.playlists));
    }

    // API 키 관리
    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            this.showApiStatus('API 키를 입력해주세요.', 'error');
            return;
        }

        this.apiKey = apiKey;
        this.saveToLocalStorage();
        this.showApiStatus('API 키가 저장되었습니다.', 'success');
        apiKeyInput.value = '';
    }

    updateApiStatus() {
        const statusEl = document.getElementById('apiStatus');
        if (this.apiKey) {
            statusEl.textContent = `API 키가 설정되어 있습니다. (${this.apiKey.substring(0, 7)}...)`;
            statusEl.className = 'api-status success';
        } else {
            statusEl.textContent = 'API 키를 설정해주세요.';
            statusEl.className = 'api-status error';
        }
    }

    showApiStatus(message, type) {
        const statusEl = document.getElementById('apiStatus');
        statusEl.textContent = message;
        statusEl.className = `api-status ${type}`;

        setTimeout(() => {
            this.updateApiStatus();
        }, 3000);
    }

    // 플레이리스트 관리
    addPlaylist() {
        const name = document.getElementById('playlistName').value.trim();
        const description = document.getElementById('playlistDesc').value.trim();
        const link = document.getElementById('playlistLink').value.trim();

        if (!name || !description || !link) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const playlist = {
            id: Date.now().toString(),
            name,
            description,
            link,
            hidden: false,
            createdAt: new Date().toISOString()
        };

        this.playlists.push(playlist);
        this.saveToLocalStorage();
        this.renderPlaylists();

        // 입력 필드 초기화
        document.getElementById('playlistName').value = '';
        document.getElementById('playlistDesc').value = '';
        document.getElementById('playlistLink').value = '';
    }

    removePlaylist(id) {
        const playlist = this.playlists.find(p => p.id === id);
        if (playlist) {
            playlist.hidden = true;
            this.saveToLocalStorage();
            this.renderPlaylists();
        }
    }

    restorePlaylist(id) {
        const playlist = this.playlists.find(p => p.id === id);
        if (playlist) {
            playlist.hidden = false;
            this.saveToLocalStorage();
            this.renderPlaylists();
        }
    }

    toggleHidden() {
        this.showHidden = !this.showHidden;
        const btn = document.getElementById('toggleHiddenBtn');
        btn.textContent = this.showHidden ? '숨김 숨기기' : '숨김 보기';
        this.renderPlaylists();
    }

    // 파일 업로드 처리
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    // 배열인 경우
                    data.forEach(item => {
                        if (item.name && item.description && item.link) {
                            this.playlists.push({
                                id: Date.now().toString() + Math.random(),
                                name: item.name,
                                description: item.description,
                                link: item.link,
                                hidden: false,
                                createdAt: new Date().toISOString()
                            });
                        }
                    });
                } else if (data.playlists && Array.isArray(data.playlists)) {
                    // 객체 형태인 경우
                    data.playlists.forEach(item => {
                        if (item.name && item.description && item.link) {
                            this.playlists.push({
                                id: Date.now().toString() + Math.random(),
                                name: item.name,
                                description: item.description,
                                link: item.link,
                                hidden: false,
                                createdAt: new Date().toISOString()
                            });
                        }
                    });
                }

                this.saveToLocalStorage();
                this.renderPlaylists();
                alert('플레이리스트가 성공적으로 업로드되었습니다.');
            } catch (error) {
                console.error('파일 파싱 오류:', error);
                alert('파일 형식이 올바르지 않습니다.');
            }
        };
        reader.readAsText(file);

        // 파일 입력 초기화
        event.target.value = '';
    }

    // 플레이리스트 렌더링
    renderPlaylists(matchedIds = []) {
        const container = document.getElementById('playlistsContainer');

        const visiblePlaylists = this.showHidden
            ? this.playlists
            : this.playlists.filter(p => !p.hidden);

        if (visiblePlaylists.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <div class="empty-state-text">플레이리스트가 없습니다. 새로운 플레이리스트를 추가해보세요!</div>
                </div>
            `;
            return;
        }

        container.innerHTML = visiblePlaylists.map(playlist => {
            const isMatched = matchedIds.includes(playlist.id);
            const cardClass = `playlist-card ${playlist.hidden ? 'hidden' : ''} ${isMatched ? 'matched' : ''}`;

            return `
                <div class="${cardClass}" data-id="${playlist.id}">
                    <div class="playlist-header">
                        <div>
                            <div class="playlist-name">
                                ${playlist.name}
                                ${playlist.hidden ? '<span class="hidden-badge">숨김</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="playlist-desc">${playlist.description}</div>
                    <a href="${playlist.link}" target="_blank" class="playlist-link">
                        🔗 플레이리스트 열기
                    </a>
                    <div class="playlist-actions">
                        ${playlist.hidden
                            ? `<button class="btn-restore" onclick="playlistManager.restorePlaylist('${playlist.id}')">복구</button>`
                            : `<button class="btn-remove" onclick="playlistManager.removePlaylist('${playlist.id}')">제거</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    // 키워드 검색 및 매칭
    async searchByKeyword() {
        const keyword = document.getElementById('keywordInput').value.trim();

        if (!keyword) {
            alert('키워드를 입력해주세요.');
            return;
        }

        if (!this.apiKey) {
            alert('먼저 OpenAI API 키를 설정해주세요.');
            return;
        }

        const activePlaylistss = this.playlists.filter(p => !p.hidden);
        if (activePlaylistss.length === 0) {
            alert('활성화된 플레이리스트가 없습니다.');
            return;
        }

        // 로딩 표시
        const loadingEl = document.getElementById('loadingIndicator');
        const searchBtn = document.getElementById('searchBtn');
        const resultsSection = document.getElementById('resultsSection');

        loadingEl.style.display = 'block';
        searchBtn.disabled = true;
        resultsSection.style.display = 'none';

        try {
            const matches = await this.matchWithAI(keyword, activePlaylistss);
            this.displayResults(matches);
        } catch (error) {
            console.error('매칭 오류:', error);
            alert('매칭 중 오류가 발생했습니다: ' + error.message);
        } finally {
            loadingEl.style.display = 'none';
            searchBtn.disabled = false;
        }
    }

    async matchWithAI(keyword, playlists) {
        // OpenAI API를 사용하여 키워드와 플레이리스트 매칭
        const playlistDescriptions = playlists.map((p, idx) =>
            `${idx + 1}. ${p.name}: ${p.description}`
        ).join('\n');

        const prompt = `사용자가 "${keyword}"라는 키워드로 플레이리스트를 찾고 있습니다.

다음은 사용 가능한 플레이리스트 목록입니다:
${playlistDescriptions}

위 플레이리스트들 중에서 사용자의 키워드와 가장 관련성이 높은 순서대로 최대 3개를 선택하고, 각각의 관련성 점수(0-100)와 추천 이유를 제공해주세요.

응답은 반드시 다음 JSON 형식으로만 해주세요:
{
  "matches": [
    {
      "index": 1,
      "score": 95,
      "reason": "추천 이유"
    }
  ]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: '당신은 음악 플레이리스트 추천 전문가입니다. 사용자의 키워드와 플레이리스트 설명을 분석하여 가장 적합한 플레이리스트를 추천합니다.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API 요청 실패');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // JSON 추출 (마크다운 코드 블록 처리)
        let jsonContent = content;
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonContent = jsonMatch[1];
        }

        const result = JSON.parse(jsonContent);

        // 결과를 플레이리스트 객체와 매핑
        return result.matches.map(match => ({
            playlist: playlists[match.index - 1],
            score: match.score,
            reason: match.reason
        }));
    }

    displayResults(matches) {
        const resultsSection = document.getElementById('resultsSection');
        const matchedPlaylists = document.getElementById('matchedPlaylists');

        if (matches.length === 0) {
            matchedPlaylists.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🤔</div>
                    <div class="empty-state-text">매칭되는 플레이리스트를 찾지 못했습니다.</div>
                </div>
            `;
        } else {
            matchedPlaylists.innerHTML = matches.map(match => {
                const { playlist, score, reason } = match;
                return `
                    <div class="playlist-card matched">
                        <div class="playlist-name">${playlist.name}</div>
                        <div class="playlist-desc">${playlist.description}</div>
                        <div class="match-score">매칭 점수: ${score}점</div>
                        <div class="playlist-desc" style="margin-top: 10px; font-style: italic; color: #4caf50;">
                            💡 ${reason}
                        </div>
                        <a href="${playlist.link}" target="_blank" class="playlist-link">
                            🔗 플레이리스트 열기
                        </a>
                    </div>
                `;
            }).join('');

            // 매칭된 플레이리스트를 전체 목록에서도 하이라이트
            const matchedIds = matches.map(m => m.playlist.id);
            this.renderPlaylists(matchedIds);
        }

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 앱 초기화
let playlistManager;
document.addEventListener('DOMContentLoaded', () => {
    playlistManager = new PlaylistManager();
});
