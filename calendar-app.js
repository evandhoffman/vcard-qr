// Calendar event-specific application logic and event handlers

// Detect user's timezone
function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch(e) {
    return 'America/New_York';
  }
}

// Set default timezone on load
const userTz = detectTimezone();
const tzSelect = $("timezone");
if (tzSelect) {
  // Try to select user's timezone
  for (let i = 0; i < tzSelect.options.length; i++) {
    if (tzSelect.options[i].value === userTz) {
      tzSelect.selectedIndex = i;
      break;
    }
  }
}

// Set default start date to today
$("startDate").value = new Date().toISOString().split('T')[0];

// Toggle time inputs
$("hasStartTime").addEventListener('change', (e) => {
  $("startTime").style.display = e.target.checked ? 'block' : 'none';
  if (e.target.checked && !$("startTime").value) {
    $("startTime").value = "09:00";
  }
  debounceRender();
});

$("hasEndTime").addEventListener('change', (e) => {
  $("endTime").style.display = e.target.checked ? 'block' : 'none';
  if (e.target.checked && !$("endTime").value) {
    $("endTime").value = "10:00";
  }
  debounceRender();
});

// Format date/time for iCalendar (YYYYMMDDTHHMMSS)
function formatICalDateTime(dateStr, timeStr, isAllDay) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (isAllDay || !timeStr) {
    // All-day event format (just date, no time)
    return `${year}${month}${day}`;
  }
  
  // Date with time
  const [hours, minutes] = timeStr.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

// Generate unique ID for event
function generateUID() {
  return 'event-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Generate iCalendar format
function makeICalendar() {
  const title = sanitizeText($("title").value);
  if (!title) {
    return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:Event title required\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
  }
  
  const startDate = $("startDate").value;
  if (!startDate) {
    return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nSUMMARY:Start date required\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
  }
  
  const hasStartTime = $("hasStartTime").checked;
  const startTime = hasStartTime ? $("startTime").value : '';
  const endDate = $("endDate").value || startDate;
  const hasEndTime = $("hasEndTime").checked;
  const endTime = hasEndTime ? $("endTime").value : '';
  const timezone = $("timezone").value;
  const location = esc(sanitizeText($("location").value));
  const description = esc(sanitizeText($("description").value));
  const organizer = sanitizeText($("organizer").value);
  const organizerEmail = $("organizerEmail").value.trim().toLowerCase();
  
  const isAllDay = !hasStartTime && !hasEndTime;
  
  // Format dates
  let dtStart = formatICalDateTime(startDate, startTime, isAllDay);
  let dtEnd = formatICalDateTime(endDate, endTime, isAllDay);
  
  // For all-day events, end date should be next day
  if (isAllDay && dtStart === dtEnd) {
    const endDateObj = new Date(endDate + 'T00:00:00');
    endDateObj.setDate(endDateObj.getDate() + 1);
    const year = endDateObj.getFullYear();
    const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(endDateObj.getDate()).padStart(2, '0');
    dtEnd = `${year}${month}${day}`;
  }
  
  // Current timestamp for DTSTAMP
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Build iCalendar format (RFC 5545)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//vCard-QR//Calendar Event Generator//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${generateUID()}@vcard-qr.local`,
    `DTSTAMP:${dtstamp}`
  ];
  
  // Add dates with timezone
  if (isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
  } else {
    lines.push(`DTSTART;TZID=${timezone}:${dtStart}`);
    lines.push(`DTEND;TZID=${timezone}:${dtEnd}`);
  }
  
  lines.push(`SUMMARY:${esc(title)}`);
  
  if (location) lines.push(`LOCATION:${location}`);
  if (description) lines.push(`DESCRIPTION:${description}`);
  
  if (organizer && organizerEmail) {
    lines.push(`ORGANIZER;CN=${esc(organizer)}:mailto:${organizerEmail}`);
  } else if (organizerEmail) {
    lines.push(`ORGANIZER:mailto:${organizerEmail}`);
  }
  
  lines.push('STATUS:CONFIRMED');
  lines.push('SEQUENCE:0');
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n') + '\r\n';
}

// Override renderQR for calendar
async function renderQR() {
  if (typeof QRCode === 'undefined') {
    console.error('QRCode library not loaded');
    $("preview").textContent = 'Error: QRCode library failed to load. Check your internet connection.';
    return;
  }
  
  const ical = makeICalendar();
  const size = Math.max(128, Math.min(parseInt($("size").value||"384",10), 2048));
  const ecl = $("ecl").value || 'M';
  
  // Clear previous QR code
  const qrbox = $("qrCanvas").parentElement;
  qrbox.innerHTML = '<div id="qrCanvas"></div>';
  
  // Generate QR code
  new QRCode($("qrCanvas"), {
    text: ical,
    width: size,
    height: size,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel[ecl]
  });

  // UI updates
  $("preview").textContent = ical;
  const bytes = new TextEncoder().encode(ical).length;
  const warn = bytes > 2500 ? 'warn' : 'ok';
  $("stats").innerHTML = `Payload size: <span class="${warn}">${bytes} bytes</span> · Tip: keep under ~2900 bytes for best compatibility.`;
}

// Event handlers
$("gen").addEventListener('click', (e) => { 
  e.preventDefault(); 
  renderQR(); 
});

$("download").addEventListener('click', (e) => {
  e.preventDefault();
  const qrImg = $("qrCanvas").querySelector('img');
  if (!qrImg) {
    alert('Please generate a QR code first');
    return;
  }
  
  const title = $("title").value.trim() || 'Event';
  const filename = title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') + '_qrcode.png';
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = qrImg.src;
  link.click();
});

$("downloadIcs").addEventListener('click', (e) => {
  e.preventDefault();
  const ical = makeICalendar();
  
  const title = $("title").value.trim() || 'Event';
  const filename = title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '') + '.ics';
  
  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
});

$("copy").addEventListener('click', async (e) => {
  e.preventDefault();
  const ical = makeICalendar();
  try {
    await navigator.clipboard.writeText(ical);
    alert('iCalendar event copied to clipboard');
  } catch(_) {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = ical;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('iCalendar event copied to clipboard');
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
const inputs = ['title', 'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'location', 'description', 'organizer', 'organizerEmail', 'ecl', 'size'];
inputs.forEach(id => {
  const el = $(id);
  if (el) {
    el.addEventListener('input', debounceRender);
    el.addEventListener('change', debounceRender);
  }
});
