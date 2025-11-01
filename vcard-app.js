// vCard-specific application logic and event handlers

$("gen").addEventListener('click', (e)=>{ e.preventDefault(); renderQR(); });

$("download").addEventListener('click', (e)=>{
  e.preventDefault();
  const qrImg = $("qrCanvas").querySelector('img');
  if (!qrImg) {
    alert('Please generate a QR code first');
    return;
  }
  // Create filename from name field
  const name = $("name").value.trim() || 'Contact';
  const filename = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') + '_qrcode.png';
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = qrImg.src;
  link.click();
});

$("downloadVcf").addEventListener('click', (e)=>{
  e.preventDefault();
  const vcard = makeVCard();
  
  // Create filename from name field
  const name = $("name").value.trim() || 'Contact';
  const filename = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') + '.vcf';
  
  // Create blob and download
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
});

$("copy").addEventListener('click', async (e)=>{
  e.preventDefault();
  const v = makeVCard();
  try{ await navigator.clipboard.writeText(v); alert('vCard copied to clipboard'); }
  catch(_){
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = v; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    alert('vCard copied to clipboard');
  }
});

// Toggle extra fields
$("toggleExtra").addEventListener('click', (e) => {
  e.preventDefault();
  const extraFields = $("extraFields");
  const btn = $("toggleExtra");
  extraFields.classList.toggle('show');
  btn.textContent = extraFields.classList.contains('show') 
    ? '▲ Hide extra fields' 
    : '▼ Show more fields';
});

// Initial render after QRCode library is loaded
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderQR, 100);
  });
} else {
  setTimeout(renderQR, 100);
}

// Add auto-regenerate on input change
const inputs = ['name', 'org', 'phone', 'email', 'useGravatar', 'title', 'work', 'url', 'street', 'city', 'region', 'postal', 'country', 'note', 'ecl', 'size'];
inputs.forEach(id => {
  const el = $(id);
  if (el) {
    el.addEventListener('input', debounceRender);
    el.addEventListener('change', debounceRender);
  }
});
