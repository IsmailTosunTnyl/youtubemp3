// Config is loaded from config.js

function showThumbnail(videoId) {
    const thumbnailContainer = document.getElementById('thumbnail');
    if (videoId) {
        thumbnailContainer.innerHTML = `
            <img src="https://img.youtube.com/vi/${videoId}/0.jpg" alt="Video Thumbnail" class="video-thumbnail">
        `;
        thumbnailContainer.classList.remove('hidden');
    } else {
        thumbnailContainer.innerHTML = '';
        thumbnailContainer.classList.add('hidden');
    }
}

async function convertMedia() {
    const youtubeUrl = document.getElementById('youtubeUrl').value;
    const formatSelect = document.getElementById('formatSelect').value;
    const qualitySelect = document.getElementById('qualitySelect').value;
    const resultDiv = document.getElementById('result');
    const progressContainer = document.getElementById('progress');
    const progressBar = progressContainer.querySelector('.progress-bar');
    const progressText = progressContainer.querySelector('.progress-text');

    if (!config || !config.RAPIDAPI_KEY) {
        resultDiv.innerHTML = '<p style="color: red;">Error: API configuration not loaded</p>';
        return;
    }

    if (!isValidYoutubeUrl(youtubeUrl)) {
        resultDiv.innerHTML = '<p style="color: red;">Please enter a valid YouTube URL, YouTube Music URL, or YouTube Short</p>';
        showThumbnail(null);
        return;
    }

    try {
        progressContainer.classList.remove('hidden');
        resultDiv.innerHTML = '';

        if (formatSelect === 'audio') {
            // MP3 download
            const apiUrl = `https://youtube-mp3-download1.p.rapidapi.com/dl?id=${extractVideoId(youtubeUrl)}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': config.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'youtube-mp3-download1.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('MP3 API Response:', data);

            if (data.link || data.url) {
                resultDiv.innerHTML = `
                    <p style="color: green;">Conversion successful!</p>
                    <a href="${data.link || data.url}" class="download-button" target="_blank">
                        Download MP3
                    </a>
                `;
            } else {
                throw new Error('No audio download link available');
            }
        } else {
            // MP4 download
            const apiUrl = `https://youtube-mp4-downloader.p.rapidapi.com/mp4?url=${encodeURIComponent(youtubeUrl)}`;
            console.log('Requesting MP4 from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': config.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'youtube-mp4-downloader.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('MP4 API Response:', data);

            if (!data.success) {
                throw new Error('Video conversion failed');
            }

            if (data.formats && data.formats.length > 0) {
                // Sort formats by resolution (highest to lowest)
                const formats = data.formats.sort((a, b) => {
                    const resA = parseInt(a.resolution);
                    const resB = parseInt(b.resolution);
                    return resB - resA;
                });

                // Select format based on quality preference
                const selectedFormat = qualitySelect === 'highest' 
                    ? formats[0]  // Highest quality (e.g., 1080p)
                    : formats[formats.length - 1];  // Lowest quality (e.g., 360p)

                resultDiv.innerHTML = `
                    <p style="color: green;">Conversion successful!</p>
                    <div class="video-info">
                        <p class="video-title">${data.title}</p>
                        <p class="video-size">Size: ${selectedFormat.size}</p>
                    </div>
                    <a href="${selectedFormat.download}" class="download-button" target="_blank">
                        Download MP4 (${selectedFormat.resolution})
                    </a>
                `;
            } else {
                throw new Error('No video formats available');
            }
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        console.error('Full error:', error);
    } finally {
        progressContainer.classList.add('hidden');
    }
}

// Add event listener for URL input
document.getElementById('youtubeUrl').addEventListener('input', function(e) {
    const url = e.target.value;
    if (isValidYoutubeUrl(url)) {
        const videoId = extractVideoId(url);
        showThumbnail(videoId);
    } else {
        showThumbnail(null);
    }
});

function isValidYoutubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\/(watch\?v=|shorts\/|v\/|u\/\w\/|embed\/|\?v=)?([^#&?]*).*/;
    return youtubeRegex.test(url);
}

function extractVideoId(url) {
    // Handle standard YouTube and YouTube Music URLs
    const standardRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const musicRegExp = /^.*((music\.youtube\.com\/)|(watch\?))\??v?=?([^#&?]*).*/;
    
    let match = url.match(standardRegExp);
    if (match && match[7] && match[7].length === 11) {
        return match[7];
    }
    
    match = url.match(musicRegExp);
    if (match && match[4] && match[4].length === 11) {
        return match[4];
    }
    
    // Handle YouTube Music song URLs
    const musicSongRegExp = /^https?:\/\/music\.youtube\.com\/watch\?v=([^#&?]*).*/;
    match = url.match(musicSongRegExp);
    if (match && match[1] && match[1].length === 11) {
        return match[1];
    }
    
    return false;
} 