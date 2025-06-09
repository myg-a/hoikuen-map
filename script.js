// アプリケーションの状態管理
class NurseryMapApp {
    // 定数定義
    static CONSTANTS = {
        // 目黒区の中心座標（緯度、経度）
        MEGURO_CENTER_LAT: 35.6339,
        MEGURO_CENTER_LNG: 139.6917,
        // 地図のデフォルトズームレベル（区全体が見える程度）
        DEFAULT_ZOOM_LEVEL: 13,
        // マーカーサイズ設定
        MARKER_SIZE: 20,
        MARKER_ANCHOR_OFFSET: 10,
        POPUP_ANCHOR_OFFSET: -10,
        // 利用可能数による色分け閾値
        MIN_AVAILABLE_FOR_GREEN: 5,
        NO_AVAILABILITY: 0,
        // モバイル判定の画面幅閾値（px）
        MOBILE_BREAKPOINT: 768,
        // LocalStorageキー
        FAVORITES_STORAGE_KEY: 'nursery-favorites'
    };
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
            this.initializeMap();
            await this.loadNurseryData();
            this.setupEventListeners();
            this.renderNurseries();
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            alert('データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    initializeMap() {
        // 目黒区の中心座標を使用して地図を初期化
        const centerCoordinates = [
            NurseryMapApp.CONSTANTS.MEGURO_CENTER_LAT, 
            NurseryMapApp.CONSTANTS.MEGURO_CENTER_LNG
        ];
        
        this.map = L.map('map').setView(centerCoordinates, NurseryMapApp.CONSTANTS.DEFAULT_ZOOM_LEVEL);
        
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
        const csvLines = csvText.trim().split('\n');
        const csvHeaders = csvLines[0].split(',');
        const validNurseries = [];

        for (let lineIndex = 1; lineIndex < csvLines.length; lineIndex++) {
            const parsedValues = this.parseCSVLine(csvLines[lineIndex]);
            
            // フィールド数が不十分な場合はスキップ
            if (parsedValues.length < csvHeaders.length) {
                continue;
            }

            const nurseryData = this.createNurseryObjectFromValues(parsedValues, lineIndex);
            
            // 有効な座標を持つ保育園のみ追加
            if (this.hasValidCoordinates(nurseryData)) {
                this.calculateTotalAvailability(nurseryData);
                validNurseries.push(nurseryData);
            }
        }

        return validNurseries;
    }

    createNurseryObjectFromValues(values, id) {
        return {
            id: id,
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
    }

    hasValidCoordinates(nursery) {
        return nursery.latitude && 
               nursery.longitude && 
               !isNaN(nursery.latitude) && 
               !isNaN(nursery.longitude);
    }

    calculateTotalAvailability(nursery) {
        nursery.totalAvailable = nursery.age0 + nursery.age1 + nursery.age2 + 
                               nursery.age3 + nursery.age4 + nursery.age5;
    }

    parseCSVLine(csvLine) {
        const parsedFields = [];
        let currentField = '';
        let isInsideQuotes = false;

        for (let characterIndex = 0; characterIndex < csvLine.length; characterIndex++) {
            const character = csvLine[characterIndex];
            
            if (character === '"') {
                isInsideQuotes = !isInsideQuotes;
            } else if (character === ',' && !isInsideQuotes) {
                parsedFields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += character;
            }
        }
        
        parsedFields.push(currentField.trim());
        return parsedFields;
    }

    calculateMarkerColorClass(nursery) {
        if (nursery.totalAvailable === NurseryMapApp.CONSTANTS.NO_AVAILABILITY) {
            return 'marker-full';
        } else if (nursery.totalAvailable >= NurseryMapApp.CONSTANTS.MIN_AVAILABLE_FOR_GREEN) {
            return 'marker-available';
        } else {
            return 'marker-partial';
        }
    }

    createCustomIcon(nursery) {
        const colorClass = this.calculateMarkerColorClass(nursery);
        
        return L.divIcon({
            className: `custom-marker ${colorClass}`,
            iconSize: [NurseryMapApp.CONSTANTS.MARKER_SIZE, NurseryMapApp.CONSTANTS.MARKER_SIZE],
            iconAnchor: [NurseryMapApp.CONSTANTS.MARKER_ANCHOR_OFFSET, NurseryMapApp.CONSTANTS.MARKER_ANCHOR_OFFSET],
            popupAnchor: [0, NurseryMapApp.CONSTANTS.POPUP_ANCHOR_OFFSET]
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
        const filteredNurseries = this.filterNurseriesByCurrentFilters();

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

    filterNurseriesByCurrentFilters() {
        return this.nurseryData.filter(nursery => {
            return this.shouldIncludeNurseryInFilter(nursery);
        });
    }

    shouldIncludeNurseryInFilter(nursery) {
        // 年齢フィルターで除外される場合は早期リターン
        if (!this.passesAgeFilter(nursery)) {
            return false;
        }

        // 施設類型フィルターで除外される場合は早期リターン
        if (!this.passesFacilityTypeFilter(nursery)) {
            return false;
        }

        // 空きありフィルターで除外される場合は早期リターン
        if (!this.passesAvailabilityFilter(nursery)) {
            return false;
        }

        return true;
    }

    passesAgeFilter(nursery) {
        if (this.currentFilters.age === '') {
            return true;
        }
        
        const ageKey = `age${this.currentFilters.age}`;
        return nursery[ageKey] > 0;
    }

    passesFacilityTypeFilter(nursery) {
        if (this.currentFilters.facilityType === '') {
            return true;
        }
        
        return nursery.type === this.currentFilters.facilityType;
    }

    passesAvailabilityFilter(nursery) {
        if (!this.currentFilters.availabilityOnly) {
            return true;
        }
        
        return nursery.totalAvailable > 0;
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
            if (window.innerWidth <= NurseryMapApp.CONSTANTS.MOBILE_BREAKPOINT) {
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
        const favoriteIndex = this.favorites.indexOf(nurseryId);
        
        if (favoriteIndex > -1) {
            this.favorites.splice(favoriteIndex, 1);
        } else {
            this.favorites.push(nurseryId);
        }

        this.saveFavorites();
        this.renderNurseries();
        this.renderFavorites();
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
        const favoriteInfo = this.getFavoriteButtonInfo(nursery.id);
        const capacityGridHTML = this.generateCapacityGridHTML(nursery);
        const extendedCareHTML = this.generateExtendedCareHTML(nursery);

        return `
            <div class="nursery-details-content">
                <h4 class="nursery-title">${nursery.name}</h4>
                <span class="nursery-type">${nursery.type}</span>
                
                ${capacityGridHTML}
                
                <p><strong>合計空き数:</strong> ${nursery.totalAvailable}人</p>
                ${extendedCareHTML}
                
                <button class="btn ${favoriteInfo.buttonClass} favorite-btn" onclick="app.toggleFavorite(${nursery.id})">${favoriteInfo.buttonText}</button>
            </div>
        `;
    }

    getFavoriteButtonInfo(nurseryId) {
        const isFavorite = this.favorites.includes(nurseryId);
        return {
            buttonText: isFavorite ? 'お気に入りから削除' : 'お気に入りに追加',
            buttonClass: isFavorite ? 'btn-secondary active' : 'btn-primary'
        };
    }

    generateCapacityGridHTML(nursery) {
        const ageGroups = [
            { age: 0, count: nursery.age0 },
            { age: 1, count: nursery.age1 },
            { age: 2, count: nursery.age2 },
            { age: 3, count: nursery.age3 },
            { age: 4, count: nursery.age4 },
            { age: 5, count: nursery.age5 }
        ];

        const capacityItems = ageGroups.map(group => {
            const availabilityClass = group.count > 0 ? 'available' : 'full';
            return `
                <div class="capacity-item">
                    <div class="capacity-age">${group.age}歳</div>
                    <div class="capacity-count ${availabilityClass}">${group.count}</div>
                </div>
            `;
        }).join('');

        return `<div class="capacity-grid">${capacityItems}</div>`;
    }

    generateExtendedCareHTML(nursery) {
        if (!nursery.extendedCare || nursery.extendedCare === '') {
            return '';
        }
        return `<p><strong>延長保育:</strong> ${nursery.extendedCare}時間</p>`;
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
        if (window.innerWidth <= NurseryMapApp.CONSTANTS.MOBILE_BREAKPOINT) {
            sidebar.classList.toggle('active');
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('active');
    }

    loadFavorites() {
        const savedFavorites = localStorage.getItem(NurseryMapApp.CONSTANTS.FAVORITES_STORAGE_KEY);
        return savedFavorites ? JSON.parse(savedFavorites) : [];
    }

    saveFavorites() {
        localStorage.setItem(NurseryMapApp.CONSTANTS.FAVORITES_STORAGE_KEY, JSON.stringify(this.favorites));
    }
}

// アプリケーション初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NurseryMapApp();
});