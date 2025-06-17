document.getElementById('bookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const isi = document.getElementById('isi').value;
  const option = document.getElementById('option').value;

  const loading = document.getElementById('loading');
  const resultImage = document.getElementById('resultImage');

  loading.style.display = 'flex';
  resultImage.style.display = 'none';

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
    };
  } catch (err) {
    alert('Terjadi kesalahan saat menghasilkan gambar.\n' + err.message);
    loading.style.display = 'none';
  }
});
