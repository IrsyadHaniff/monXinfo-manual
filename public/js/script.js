// Logika dark/light mode
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const sunIcon = document.getElementById("icon-sun");
  const moonIcon = document.getElementById("icon-moon");

  // Init Theme
  if (localStorage.getItem("theme") === "light") {
    document.documentElement.classList.remove("dark");
    updateIcons(false);
  } else {
    document.documentElement.classList.add("dark");
    updateIcons(true);
  }

  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateIcons(isDark);
  });

  function updateIcons(isDark) {
    sunIcon.classList.toggle("hidden", !isDark);
    moonIcon.classList.toggle("hidden", isDark);
  }
});

// Logika Page Loader
window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");

  // delay
  setTimeout(() => {
    loader.classList.add("hidden");
  }, 600);
});

//tombol kembali ke atas
const toTop = document.querySelector(".to-top");

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 100) {
    toTop.classList.add("active");
  } else {
    toTop.classList.remove("active");
  }
})

//non-aktifkan klick kanan
// document.addEventListener("contextmenu", (e) => e.preventDefault());
