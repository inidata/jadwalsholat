 // Fungsi untuk memutar suara adzan
  function playAdzan(reciter) {
    var sound = new Howl({
      src: [`https://inidata.github.io/jadwalsholat/athan.mp3`],
      html5: true  // Menggunakan HTML5 audio untuk mendukung lebih banyak browser
    });
    sound.play();

    // Menampilkan elemen audio setelah memutar
    document.getElementById('adzanAudio').style.display = 'block';
  }

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
    const apiURL = `https://api.aladhan.com/v1/timingsByAddress/${dd}-${mm}-${yyyy}?address=${city}&method=5`;

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
      })
      .then(() => {
        highlightNextPrayer();
        updateCountdown();
      })
      .catch((error) => {
        console.error("Error fetching timings:", error);
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
    const nextPrayerElement = document.querySelector(".next");
    if (nextPrayerElement) {
      const { name, time } = nextPrayerElement.dataset;
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
  }

  // Menghighlight jadwal berikutnya
  function highlightNextPrayer() {
    // Memformat jam menjadi hh.mm
    const d = new Date();
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const time = Number(`${hours}.${minutes}`);

    // Mencari jadwal terdekat berikutnya
    let nextPrayerTime;
    for (const name in timings) {
      const timing = Number(timings[name].split(":")[0] + "." + timings[name].split(":")[1]);
      if (timing >= time) {
        nextPrayerTime = timings[name];
        break;
      }
    }

    // Menambah class .next untuk element yang dataset time nya sama dengan nextPrayerTime
    document.querySelectorAll(".prayer").forEach((item) => {
      item.classList.remove("next");

      if (nextPrayerTime === item.dataset.time) {
        item.classList.add("next");
        playAdzanOnPrayerTime("athan"); // Memanggil fungsi playAdzanOnPrayerTime saat waktu sholat
      }
    });
  }

  // Memainkan suara adzan saat waktu sholat
  function playAdzanOnPrayerTime(reciter) {
    const nextPrayerElement = document.querySelector(".next");
    if (nextPrayerElement) {
      const { name, time } = nextPrayerElement.dataset;

      // Mendapatkan waktu sholat yang sedang ditekankan
      const nextTime = new Date().setHours(
        time.split(":")[0],
        time.split(":")[1],
        0,
      );

      // Mendapatkan waktu saat ini
      const currentTime = new Date();

      // Jika waktu saat ini sama dengan waktu sholat yang sedang ditekankan, mainkan suara adzan
      if (currentTime.getTime() === nextTime) {
        playAdzan(reciter);
      }
    }
  }

  // Cek apakah audio diaktifkan, jika tidak, mainkan secara otomatis
  document.getElementById('adzanAudio').addEventListener('play', function () {
    document.getElementById('adzanAudio').style.display = 'block';
  });

  document.getElementById('adzanAudio').addEventListener('error', function () {
    playAdzan("athan");
  });

  setInterval(() => {
    highlightNextPrayer();
    updateCountdown();
  }, 1000);
