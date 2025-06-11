// アプリケーションの状態管理
class NurseryMapApp {
    constructor() {
        this.map = null;
        this.nurseryData = [];
        this.markers = [];
        this.favorites = this.loadFavorites();
        this.currentFilters = {
            age: '',
            facilityType: '',
            availabilityOnly: false
        };
        
        this.init();
    }

    async init() {
        try {
            this.initMap();
            await this.loadNurseryData();
            this.setupEventListeners();
            this.renderNurseries();
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            alert('データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    initMap() {
        // 目黒区の中心座標
        const center = [35.6339, 139.6917];
        
        this.map = L.map('map').setView(center, 13);
        
        // OpenStreetMapタイルを追加
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    async loadNurseryData() {
        try {
            const response = await fetch('./20250601_hoikuen_utf8.csv');
            const csvText = await response.text();
            this.nurseryData = this.parseCSV(csvText);
        } catch (error) {
            console.error('CSVデータの読み込みに失敗しました:', error);
            throw error;
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
                const nursery = {
                    id: i,
                    date: values[0],
                    name: values[1],
                    type: values[2],
                    ageGroup: values[3],
                    age0: parseInt(values[4]) || 0,
                    age1: parseInt(values[5]) || 0,
                    age2: parseInt(values[6]) || 0,
                    age3: parseInt(values[7]) || 0,
                    age4: parseInt(values[8]) || 0,
                    age5: parseInt(values[9]) || 0,
                    extendedCare: values[10],
                    latitude: parseFloat(values[11]),
                    longitude: parseFloat(values[12])
                };

                // 緯度・経度が有効な場合のみ追加
                if (nursery.latitude && nursery.longitude && !isNaN(nursery.latitude) && !isNaN(nursery.longitude)) {
                    nursery.totalAvailable = nursery.age0 + nursery.age1 + nursery.age2 + nursery.age3 + nursery.age4 + nursery.age5;
                    data.push(nursery);
                }
            }
        }

        return data;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    getMarkerColor(nursery) {
        if (nursery.totalAvailable === 0) {
            return 'marker-full';
        } else if (nursery.totalAvailable >= 5) {
            return 'marker-available';
        } else {
            return 'marker-partial';
        }
    }

    createCustomIcon(nursery) {
        const colorClass = this.getMarkerColor(nursery);
        
        return L.divIcon({
            className: `custom-marker ${colorClass}`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
            popupAnchor: [0, -10]
        });
    }

    createPopupContent(nursery) {
        const isFavorite = this.favorites.includes(nursery.id);
        const favoriteButtonText = isFavorite ? 'お気に入りから削除' : 'お気に入りに追加';
        const favoriteButtonClass = isFavorite ? 'btn-secondary' : 'btn-primary';

        return `
            <div class="popup-content">
                <div class="popup-title">${nursery.name}</div>
                <div class="popup-type">${nursery.type}</div>
                <div class="popup-capacity">
                    <strong>年齢別空き状況:</strong><br>
                    0歳: ${nursery.age0}人 | 1歳: ${nursery.age1}人 | 2歳: ${nursery.age2}人<br>
                    3歳: ${nursery.age3}人 | 4歳: ${nursery.age4}人 | 5歳: ${nursery.age5}人<br>
                    <strong>合計空き: ${nursery.totalAvailable}人</strong>
                </div>
                <div class="popup-actions">
                    <button class="popup-btn btn btn-outline" onclick="app.showNurseryDetails(${nursery.id})">詳細表示</button>
                    <button class="popup-btn btn ${favoriteButtonClass}" onclick="app.toggleFavorite(${nursery.id})">${favoriteButtonText}</button>
                </div>
            </div>
        `;
    }

    renderNurseries() {
        // 既存のマーカーをクリア
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // フィルタリングされた保育園データを取得
        const filteredNurseries = this.getFilteredNurseries();

        // マーカーを追加
        filteredNurseries.forEach(nursery => {
            const marker = L.marker([nursery.latitude, nursery.longitude], {
                icon: this.createCustomIcon(nursery)
            });

            marker.bindPopup(this.createPopupContent(nursery));
            marker.addTo(this.map);
            this.markers.push(marker);
        });
    }

    getFilteredNurseries() {
        return this.nurseryData.filter(nursery => {
            // 年齢フィルター
            if (this.currentFilters.age !== '') {
                const ageKey = `age${this.currentFilters.age}`;
                if (nursery[ageKey] === 0) {
                    return false;
                }
            }

            // 施設類型フィルター
            if (this.currentFilters.facilityType !== '' && 
                nursery.type !== this.currentFilters.facilityType) {
                return false;
            }

            // 空きありフィルター
            if (this.currentFilters.availabilityOnly && nursery.totalAvailable === 0) {
                return false;
            }

            return true;
        });
    }

    setupEventListeners() {
        // フィルターイベント
        document.getElementById('age-filter').addEventListener('change', (e) => {
            this.currentFilters.age = e.target.value;
            this.renderNurseries();
        });

        document.getElementById('facility-type-filter').addEventListener('change', (e) => {
            this.currentFilters.facilityType = e.target.value;
            this.renderNurseries();
        });

        document.getElementById('availability-filter').addEventListener('change', (e) => {
            this.currentFilters.availabilityOnly = e.target.checked;
            this.renderNurseries();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });

        // ヘッダーボタンイベント
        document.getElementById('favorites-btn').addEventListener('click', () => {
            this.toggleFavoritesPanel();
        });

        document.getElementById('filter-btn').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // モバイル対応: マップクリックでサイドバーを閉じる
        this.map.on('click', () => {
            if (window.innerWidth <= 768) {
                this.closeSidebar();
            }
        });
    }

    clearFilters() {
        this.currentFilters = {
            age: '',
            facilityType: '',
            availabilityOnly: false
        };

        document.getElementById('age-filter').value = '';
        document.getElementById('facility-type-filter').value = '';
        document.getElementById('availability-filter').checked = false;

        this.renderNurseries();
    }

    toggleFavorite(nurseryId) {
        const index = this.favorites.indexOf(nurseryId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(nurseryId);
        }

        this.saveFavorites();
        this.renderNurseries();
        this.renderFavorites();

        // 詳細パネル表示中は内容を更新
        const infoPanel = document.getElementById('nursery-info');
        if (infoPanel && infoPanel.style.display !== 'none') {
            this.showNurseryDetails(nurseryId);
        }
    }

    showNurseryDetails(nurseryId) {
        const nursery = this.nurseryData.find(n => n.id === nurseryId);
        if (!nursery) return;

        const detailsElement = document.getElementById('nursery-details');
        const infoPanel = document.getElementById('nursery-info');
        
        detailsElement.innerHTML = this.createNurseryDetailsHTML(nursery);
        infoPanel.style.display = 'block';

        // お気に入りパネルを非表示
        document.getElementById('favorites-panel').style.display = 'none';
    }

    createNurseryDetailsHTML(nursery) {
        const isFavorite = this.favorites.includes(nursery.id);
        const favoriteButtonText = isFavorite ? 'お気に入りから削除' : 'お気に入りに追加';
        const favoriteButtonClass = isFavorite ? 'btn-secondary active' : 'btn-primary';

        return `
            <div class="nursery-details-content">
                <h4 class="nursery-title">${nursery.name}</h4>
                <span class="nursery-type">${nursery.type}</span>
                
                <div class="capacity-grid">
                    <div class="capacity-item">
                        <div class="capacity-age">0歳</div>
                        <div class="capacity-count ${nursery.age0 > 0 ? 'available' : 'full'}">${nursery.age0}</div>
                    </div>
                    <div class="capacity-item">
                        <div class="capacity-age">1歳</div>
                        <div class="capacity-count ${nursery.age1 > 0 ? 'available' : 'full'}">${nursery.age1}</div>
                    </div>
                    <div class="capacity-item">
                        <div class="capacity-age">2歳</div>
                        <div class="capacity-count ${nursery.age2 > 0 ? 'available' : 'full'}">${nursery.age2}</div>
                    </div>
                    <div class="capacity-item">
                        <div class="capacity-age">3歳</div>
                        <div class="capacity-count ${nursery.age3 > 0 ? 'available' : 'full'}">${nursery.age3}</div>
                    </div>
                    <div class="capacity-item">
                        <div class="capacity-age">4歳</div>
                        <div class="capacity-count ${nursery.age4 > 0 ? 'available' : 'full'}">${nursery.age4}</div>
                    </div>
                    <div class="capacity-item">
                        <div class="capacity-age">5歳</div>
                        <div class="capacity-count ${nursery.age5 > 0 ? 'available' : 'full'}">${nursery.age5}</div>
                    </div>
                </div>
                
                <p><strong>合計空き数:</strong> ${nursery.totalAvailable}人</p>
                ${nursery.extendedCare && nursery.extendedCare !== '' ? `<p><strong>延長保育:</strong> ${nursery.extendedCare}時間</p>` : ''}
                
                <button class="btn ${favoriteButtonClass} favorite-btn" onclick="app.toggleFavorite(${nursery.id})">${favoriteButtonText}</button>
            </div>
        `;
    }

    toggleFavoritesPanel() {
        const favoritesPanel = document.getElementById('favorites-panel');
        const nurseryInfo = document.getElementById('nursery-info');
        
        if (favoritesPanel.style.display === 'none') {
            favoritesPanel.style.display = 'block';
            nurseryInfo.style.display = 'none';
            this.renderFavorites();
        } else {
            favoritesPanel.style.display = 'none';
        }
    }

    renderFavorites() {
        const favoritesList = document.getElementById('favorites-list');
        
        if (this.favorites.length === 0) {
            favoritesList.innerHTML = '<p class="no-favorites">お気に入りに追加された保育園はありません</p>';
            return;
        }

        const favoritesHTML = this.favorites.map(nurseryId => {
            const nursery = this.nurseryData.find(n => n.id === nurseryId);
            if (!nursery) return '';

            return `
                <div class="favorite-item" onclick="app.showNurseryDetails(${nursery.id})">
                    <h4>${nursery.name}</h4>
                    <p>${nursery.type} | 空き: ${nursery.totalAvailable}人</p>
                </div>
            `;
        }).join('');

        favoritesList.innerHTML = favoritesHTML;
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active');
    }

    loadFavorites() {
        const saved = localStorage.getItem('nursery-favorites');
        return saved ? JSON.parse(saved) : [];
    }

    saveFavorites() {
        localStorage.setItem('nursery-favorites', JSON.stringify(this.favorites));
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NurseryMapApp();
});