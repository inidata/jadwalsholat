let timings;

// Mendapatkan data dan menampilkan jadwal
function fetchTimingsByLocation() {
  // Mendapatkan lokasi pengguna
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      fetchCityByCoordinates(latitude, longitude);
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

// Mendapatkan nama kota berdasarkan koordinat
function fetchCityByCoordinates(latitude, longitude) {
  const apiURL = `https://us1.locationiq.com/v1/reverse.php?key=pk.c0c00869df7399311b4b8bdca2e3eaae&lat=${latitude}&lon=${longitude}&format=json`;

  fetch(apiURL)
    .then((res) => res.json())
    .then((data) => {
      const city = data.address.city;
      fetchTimings(city);
    })
    .catch((error) => {
      console.error("Error fetching city:", error);
    });
}

// Mendapatkan data jadwal berdasarkan kota
function fetchTimings(city) {
  // Memformat tanggal
  let d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  // Mendapatkan data jadwal berdasarkan kota
  const apiURL = `https://api.aladhan.com/v1/timingsByAddress/${dd}-${mm}-${yyyy}?address=${city}`;

  fetch(apiURL)
    .then((res) => res.json())
    .then((data) => {
      timings = data.data.timings;

      const elements = [];
      for (const name in timings) {
        const value = timings[name];
        elements.push(
          `<div class="prayer" data-time="${value}" data-name="${name}">
            <div>${name}</div>
            <div>${value}</div>
           </div>`,
        );
      }

      document.querySelector("#container").innerHTML = elements.join("");
    });
}

// Panggil fungsi untuk mendapatkan jadwal berdasarkan lokasi GPS saat halaman dimuat
fetchTimingsByLocation();

// Atur interval untuk memperbarui jadwal dan lokasi setiap beberapa detik
setInterval(() => {
  fetchTimingsByLocation();
}, 60000); // Contoh: setiap 60 detik (1 menit)


// Membuat countdown untuk jadwal berikutnya
function updateCountdown() {
  const { name, time } = document.querySelector(".next").dataset;
  const currentTime = new Date();
  const nextTime = new Date().setHours(
    time.split(":")[0],
    time.split(":")[1],
    0,
  );
  const timeDiff = nextTime - currentTime;

  if (timeDiff > 0) {
    // Hitung waktu yang tersisa
    const secondsLeft = Math.floor(timeDiff / 1000);
    const minutesLeft = Math.floor(secondsLeft / 60);
    const hoursLeft = Math.floor(minutesLeft / 60);
    const daysLeft = Math.floor(hoursLeft / 24);

    const displaySeconds = secondsLeft % 60;
    const displayMinutes = minutesLeft % 60;
    const displayHours = hoursLeft % 24;

    // Tampilkan pesan countdown sesuai nama waktu sholat
    let countdownMessage = "";
    if (daysLeft > 0) countdownMessage += `${daysLeft} day, `;
    if (displayHours > 0) countdownMessage += `${displayHours} hour, `;
    if (displayMinutes > 0) countdownMessage += `${displayMinutes} minutes, `;
    countdownMessage += `${displaySeconds} seconds to ${name}`;

    document.getElementById("countdown").textContent = countdownMessage;
  }
}

// Menghighlight jadwal berikutnya
function highlightNextPrayer() {
  // Memformat jam menjadi hh.mm
  const d = new Date();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const time = Number(`${hours}.${minutes}`);

  // Mengurutkan jadwal dari yang terkecil
  const prayerTimings = Object.values(timings).sort();

  // Mencari jadwal terdekat berikutnya
  let nextPrayerTime;
  for (let i = 0; i < prayerTimings.length; i++) {
    const timing = Number(prayerTimings[i].replace(":", "."));
    if (timing >= time) {
      nextPrayerTime = prayerTimings[i];
      break;
    }
  }

  // Menambah class .next untuk element yang dataset time nya sama dengan nextPrayerTime
  document.querySelectorAll(".prayer").forEach((item) => {
    item.classList.remove("next");

    if (nextPrayerTime === item.dataset.time) {
      item.classList.add("next");
    }
  });
}

fetchTimings();
setInterval(() => {
  highlightNextPrayer();
  updateCountdown();
}, 1000);