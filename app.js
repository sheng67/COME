// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCdcLb6eD7IsqHyMDBTNFDY1QCr9ERQch0",
    projectId: "zhaorv",
    appId: "1:974011347762:web:6e0ecafe1b63e64a36dd2b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Vue Application
const app = Vue.createApp({
    data() {
        return {
            loading: true,
            currentView: 'home',
            searchOpen: false,
            searchQuery: '',
            hasUpdate: false,
            categories: [],
            movies: [],
            series: [],
            channels: [],
            playlists: [],
            sliderItems: [],
            currentSlide: 0,
            selectedItem: null
        };
    },

    computed: {
        filteredMovies() {
            return this.movies.filter(m =>
                m.title.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },
        filteredSeries() {
            return this.series.filter(s =>
                s.title.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },
        filteredChannels() {
            return this.channels.filter(c =>
                c.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        },
        filteredPlaylists() {
            return this.playlists.filter(p =>
                p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
    },

    mounted() {
        this.registerServiceWorker();
        this.loadData();
        this.checkUpdates();
    },

    methods: {
        // Register Service Worker for PWA
        async registerServiceWorker() {
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('SW registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.hasUpdate = true;
                            }
                        });
                    });
                } catch (error) {
                    console.log('SW registration failed:', error);
                }
            }
        },

        // Load all data from Firestore
        async loadData() {
            try {
                // Load categories
                const catSnap = await db.collection('categories').get();
                this.categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Load movies
                const mSnap = await db.collection('videos')
                    .where('type', '==', 'movie')
                    .where('active', '==', true)
                    .get();
                this.movies = mSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Load series
                const sSnap = await db.collection('videos')
                    .where('type', '==', 'tvshow')
                    .where('active', '==', true)
                    .get();
                this.series = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Load live TV channels
                const cSnap = await db.collection('liveTV').get();
                this.channels = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Load playlists
                const pSnap = await db.collection('playlists').get();
                this.playlists = pSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Setup slider with featured content
                this.sliderItems = [
                    ...this.movies.filter(m => m.featured).slice(0, 3),
                    ...this.series.filter(s => s.featured).slice(0, 2),
                    ...this.movies.slice(0, 5),
                    ...this.series.slice(0, 5)
                ].slice(0, 5);

                // Auto-rotate slider
                if (this.sliderItems.length > 1) {
                    setInterval(() => {
                        this.currentSlide = (this.currentSlide + 1) % this.sliderItems.length;
                    }, 5000);
                }

            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                this.loading = false;
            }
        },

        // Get content by category
        getCategoryContent(catName) {
            return [...this.movies, ...this.series].filter(i => i.category === catName);
        },

        // Get channels by category
        getCategoryChannels(catName) {
            return this.channels.filter(ch => ch.category === catName);
        },

        // Check for app updates
        async checkUpdates() {
            try {
                const doc = await db.collection('app_settings').doc('version_control').get();
                if (doc.exists && parseFloat(doc.data().latest_version) > 1.0) {
                    this.hasUpdate = true;
                }
            } catch (error) {
                console.log('Update check failed:', error);
            }
        },

        // Open detail modal
        openDetails(item) {
            this.selectedItem = item;
            document.body.style.overflow = 'hidden';
        },

        // Close detail modal
        closeDetails() {
            this.selectedItem = null;
            document.body.style.overflow = '';
        },

        // Play video
        playVideo(url) {
            if (!url) {
                alert('Video URL not available');
                return;
            }
            window.location.href = 'player.html?url=' + encodeURIComponent(url);
        },

        // Handle image load errors
        imgError(e) {
            e.target.src = 'https://via.placeholder.com/115x165/1a1a1a/00e600?text=No+Image';
        },

        // Trigger Android interface (for WebView apps)
        triggerAndroid(action) {
            if (typeof window.Android !== 'undefined') {
                window.Android.performAction(action);
            } else {
                console.log('Android action triggered:', action);
            }
        },

        // Refresh app when update available
        refreshApp() {
            window.location.reload();
        }
    }
}).mount('#app');