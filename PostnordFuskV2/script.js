// Mappning av knapp-ID till textfil i mappen 'makron'
const fileMap = {
  btn1: 'makron/uppdatera stopp (konsol).txt',
  btn2: 'makron/aktiviteter lastade (konsol).txt',
  btn3: 'makron/uppdatera bilar (konsol).txt',
  btn4: 'makron/flexa (konsol).txt',
  btn5: 'makron/excel makro (uppdatera stopp).txt',
  btn6: 'makron/excel makro (aktiviteter lastade).txt',
  btn7: 'makron/excel makro (bilar ai).txt',
  btn8: 'makron/excel makro (bilar aj).txt',
  btn9: 'makron/alla som är klara.txt',
  btn10:'makron/excel makro (skriva ut planering).txt'
};

// Fallback if navigator.clipboard fails
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

document.querySelectorAll('.copy-btn').forEach(btn => {
  const originalHTML = btn.innerHTML;
  btn.addEventListener('click', async () => {
    const filePath = fileMap[btn.id] || null;
    let textToCopy = '';

    if (filePath) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Network response was not ok');
        textToCopy = await response.text();
      } catch (err) {
        console.error('Error fetching file', err);
        textToCopy = '';
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }

    btn.classList.add('clicked');
    btn.innerHTML = '✅ Kopierat!';
    setTimeout(() => {
      btn.classList.remove('clicked');
      btn.innerHTML = originalHTML;
    }, 1500);
  });
});