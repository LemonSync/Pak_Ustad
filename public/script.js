document.getElementById('bookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const isi = document.getElementById('isi').value.trim();
  const option = document.getElementById('option').value;

  const loading = document.getElementById('loading');
  const resultImage = document.getElementById('resultImage');
  const downloadBtn = document.getElementById('downloadBtn');

  if (!isi) {
    alert('Isi tidak boleh kosong!');
    return;
  }

  loading.style.display = 'flex';
  resultImage.style.display = 'none';
  downloadBtn.style.display = 'none';

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isi, option })
    });

    if (!response.ok) {
      const errText = await response.json();
      throw new Error('Gagal menghasilkan gambar: ' + errText.message);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    resultImage.src = imageUrl;

    resultImage.onload = () => {
      loading.style.display = 'none';
      resultImage.style.display = 'block';
      downloadBtn.style.display = 'inline-block';

      downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = resultImage.src;
        link.download = 'pak_ustadz_meme.png';
        link.click();
      };
    };
  } catch (err) {
    alert('Terjadi kesalahan saat menghasilkan gambar.\n' + err.message);
    loading.style.display = 'none';
  }
});
