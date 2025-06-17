document.getElementById('bookForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const isiInput = document.getElementById('isi');
  const optionInput = document.getElementById('option');
  const loading = document.getElementById('loading');
  const resultImage = document.getElementById('resultImage');
  const submitBtn = document.querySelector('#bookForm button[type="submit"]');

  const isi = isiInput.value.trim();
  const option = optionInput.value;

  loading.style.display = 'flex';
  resultImage.style.display = 'none';
  submitBtn.disabled = true;

  if (!isi) {
    alert('Teks tidak boleh kosong.');
    loading.style.display = 'none';
    submitBtn.disabled = false;
    return;
  }

  if (isi.length > 68) {
    alert('Teks tidak boleh lebih dari 68 karakter.');
    loading.style.display = 'none';
    submitBtn.disabled = false;
    return;
  }

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isi, option })
    });

    if (!response.ok) {
      let errorMsg = 'Gagal menghasilkan gambar.';
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch {
        const errText = await response.text();
        errorMsg += '\n' + errText;
      }
      throw new Error(errorMsg);
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
  } finally {
    submitBtn.disabled = false;
  }
});
