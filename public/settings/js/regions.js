let map, draw;
let regionModal;
let editingRegionId = null;
let regions = [];

document.addEventListener('DOMContentLoaded', () => {
    loadSideBar();
    
    regionModal = new bootstrap.Modal(document.getElementById('regionModal'));
    
    // Haritayı başlat
    initMap();
    
    // Bölgeleri yükle
    loadRegions();
});

function initMap() {
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [29.0335, 41.0053], // İstanbul
        zoom: 10
    });

    // Çizim aracını ekle
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            polygon: true,
            trash: true
        }
    });
    
    map.addControl(draw);

    // Çizim olaylarını dinle
    map.on('draw.create', updateCoordinates);
    map.on('draw.update', updateCoordinates);
    map.on('draw.delete', updateCoordinates);
}

function updateCoordinates(e) {
    const data = draw.getAll();
    if (data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates;
        document.getElementById('coordinates').value = JSON.stringify(coordinates);
    } else {
        document.getElementById('coordinates').value = '';
    }
}

async function loadRegions() {
    try {
        const response = await fetch(`${API_URL}/settings/delivery-regions`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        regions = data.regions;
        renderRegionsList();
        showRegionsOnMap();
    } catch (error) {
        console.error('Regions loading error:', error);
        showError('Bölgeler yüklenemedi');
    }
}

function renderRegionsList() {
    const list = document.getElementById('regionsList');
    
    if (!regions?.length) {
        list.innerHTML = '<div class="list-group-item text-center">Bölge bulunamadı</div>';
        return;
    }

    list.innerHTML = regions.map(region => `
        <div class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${region.name}</h6>
                <small>${formatCurrency(region.delivery_fee)}</small>
            </div>
            <p class="mb-1">
                <small class="text-muted">
                    ${region.min_time}-${region.max_time} dk
                    <span class="badge bg-${region.status === 'active' ? 'success' : 'secondary'} ms-2">
                        ${region.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                </small>
            </p>
            <div class="btn-group btn-group-sm mt-2">
                <button class="btn btn-outline-primary" onclick="editRegion(${region.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger ms-1" onclick="deleteRegion(${region.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function showRegionsOnMap() {
    // Önceki bölgeleri temizle
    if (map.getLayer('regions')) {
        map.removeLayer('regions');
        map.removeSource('regions');
    }

    // Bölgeleri haritaya ekle
    map.addSource('regions', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: regions.map(region => ({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: region.coordinates
                },
                properties: {
                    name: region.name,
                    status: region.status
                }
            }))
        }
    });

    map.addLayer({
        id: 'regions',
        type: 'fill',
        source: 'regions',
        paint: {
            'fill-color': [
                'match',
                ['get', 'status'],
                'active', 'rgba(0, 123, 255, 0.2)',
                'rgba(108, 117, 125, 0.2)'
            ],
            'fill-outline-color': [
                'match',
                ['get', 'status'],
                'active', '#007bff',
                '#6c757d'
            ]
        }
    });
}

async function saveRegion() {
    const form = document.getElementById('regionForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const url = editingRegionId ? 
            `${API_URL}/settings/regions/${editingRegionId}` : 
            `${API_URL}/settings/regions`;

        const response = await fetch(url, {
            method: editingRegionId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        regionModal.hide();
        await loadRegions();
        showSuccess(editingRegionId ? 'Bölge güncellendi' : 'Bölge oluşturuldu');

    } catch (error) {
        console.error('Region save error:', error);
        showError('Bölge kaydedilemedi');
    }
}

async function editRegion(id) {
    try {
        const response = await fetch(`${API_URL}/settings/regions/${id}`);
        if (!response.ok) throw new Error('API Hatası');
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        editingRegionId = id;
        const form = document.getElementById('regionForm');
        const region = data.region;

        // Form alanlarını doldur
        Object.keys(region).forEach(key => {
            if (form.elements[key]) {
                form.elements[key].value = region[key];
            }
        });

        // Haritada bölgeyi göster
        draw.deleteAll();
        if (region.coordinates) {
            draw.add({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: JSON.parse(region.coordinates)
                }
            });
        }

        document.getElementById('modalTitle').textContent = 'Bölge Düzenle';
        regionModal.show();

    } catch (error) {
        console.error('Region edit error:', error);
        showError('Bölge bilgileri yüklenemedi');
    }
}

async function deleteRegion(id) {
    if (!confirm('Bu bölgeyi silmek istediğinize emin misiniz?')) return;

    try {
        const response = await fetch(`${API_URL}/settings/regions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('API Hatası');
        const result = await response.json();
        if (!result.success) throw new Error(result.error);

        await loadRegions();
        showSuccess('Bölge silindi');
    } catch (error) {
        console.error('Region delete error:', error);
        showError('Bölge silinemedi');
    }
}

function filterRegions() {
    const searchText = document.getElementById('regionSearch').value.toLowerCase();
    const listItems = document.getElementById('regionsList').children;

    for (let item of listItems) {
        const regionName = item.querySelector('h6')?.textContent.toLowerCase() || '';
        item.style.display = regionName.includes(searchText) ? '' : 'none';
    }
}

function showNewRegionModal() {
    editingRegionId = null;
    document.getElementById('modalTitle').textContent = 'Yeni Bölge';
    document.getElementById('regionForm').reset();
    draw.deleteAll();
    regionModal.show();
}
