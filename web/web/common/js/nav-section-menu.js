const getRole = localStorage.getItem("role");
const isAccountPage = window.location.pathname.includes("account-management");

// Utility functions for role checking
function isAccountAdminOnly() {
  const accountAdmin = localStorage.getItem("accountAdmin");
  const currentRole = localStorage.getItem("role");
  return (
    accountAdmin === "true" &&
    currentRole !== ADMIN &&
    currentRole !== SUPERADMIN
  );
}

function isAdminOrSuperAdmin() {
  const currentRole = localStorage.getItem("role");
  return currentRole === ADMIN || currentRole === SUPERADMIN;
}

function hasAdminPrivileges() {
  const accountAdmin = localStorage.getItem("accountAdmin");
  return accountAdmin === "true" || isAdminOrSuperAdmin();
}

$(document).ready(function () {
  const getCollegeName = localStorage.getItem("collegeName") || "Digival";
  const getCollegeLogo =
    localStorage.getItem("collegeLogo") || "../../common/imgs/school.png";

  let enableInsight = localStorage.getItem("enableInsight");
  let enableGroupCreation = localStorage.getItem("enableGroupCreation");

  if (enableInsight == null || enableGroupCreation == null) {
    getAccountDetails();
  }

  const style = `
   :root {
  --primary-color: #1877f2;
  --secondary-color: #e7f3ff;
  --accent-color: #f4f8f9;
  --bg-gradient: linear-gradient(
    to top,
    #c5e1eb,
    #d1e7ed,
    #ddedf0,
    #eaf3f4,
    #f7f9f9
  );
  --text-color: #898989;
  --text-light-color: #dad3d3;
  --white-color: #fff;
  --success-color: #63b98a;
  --failure-color: #ea8181;
  --border-color: #dad3d3;
  --hover-color: #e7f3ff;
}
    .nav-bar {
    height:calc(100vh - 48px);
  background-color: #fff;
  width: 60px;
  min-width: 60px;
  transition: all 0.3s ease;
  z-index: 999;
  box-shadow: rgba(126, 126, 126, 0.2) 0px 2px 8px 0px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.nav-bar::-webkit-scrollbar {
  width: 7px;
}

.nav-bar::-webkit-scrollbar-track {
  border-radius: 10px;
}

.nav-bar::-webkit-scrollbar-thumb {
  background: #d6d6d6ff;
  border-radius: 10px;
}

.nav-bar.expanded {
  width: 250px !important;
}

#side-nav-bar .bx-chevron-left {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color:var(--border-color);
  padding: 2px;
  border-radius: 50%;
  font-size: 20px;
  color: #fdfdfd;
  cursor: pointer;
  opacity: 0;
  z-index: 10;
}

.hamburger-container {
  padding: 10px 0;
  margin-bottom: 20px;
}

.bx-menu {
  color: var(--text-color);
  padding: 5px;
  border-radius: 50%;
  font-size: 30px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Menu styling */
.main-menu {
  overflow-y: auto;
  flex-grow: 1;
  padding: 0px 10px;
}

.main-menu a {
  text-decoration: none;
  list-style: none;
  color: var(--text-color);
  display: flex;
  align-items: center;
  width: 100%;
}

.menu-item {
  margin: 10px -3px !important;
  padding: 8px 0 !important;
}

.main-menu .menu-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  min-width: 45px;
}

.main-menu .menu-text {
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-left: 0px;
  flex-grow: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 180px;
}

.nav-bar.expanded .menu-text {
  opacity: 1;
}

#stu-href{
  text-decoration: none;
  list-style: none;
  color: var( --text-color);
}
ul {
  list-style: none;
  padding-left: 0 !important; /* Override Bootstrap default */
}
ul li {
  font-weight: bold;
  letter-spacing: 0.5px;
  color: var(--text-color);
  text-transform: uppercase;
  font-size: 13px;
  margin: 15px 6px 0px 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 8px 5px;
  border-radius: 6px;
  white-space: nowrap;
}
ul li:hover{
  color: #147afc;
  background-color: rgba(20, 122, 252, 0.1);
}
.main-menu,
.logouy-menu {
  overflow: hidden;
}

.active-menu {
  color: #147afc !important;
  background-color: rgba(20, 122, 252, 0.1);
}

.active-menu .menu-icon i,
.active-menu .menu-text {
  color: #147afc !important;
}

.main-menu a:hover .menu-icon i,
.main-menu a:hover .menu-text {
  color: #147afc;
}

.menu-icon i {
  font-size: 22px;
  transition: color 0.3s ease;
}

.menu-text {
  font-size: 15px;
  margin-left: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: capitalize;
  color: #818181;
}

.nav-link-custom {
  display: none;
}

#stu-href, #acc-href, #exam-href, #report-href {
  text-decoration: none;
  list-style: none;
  color: inherit;
  display: flex;
  align-items: center;
  width: 100%;
 
}

/* College info styling */
.college-info {
  opacity: 0;
  transition: opacity 0.3s ease;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
}


.nav-bar.expanded .college-info {
  opacity: 1;
  max-height: 150px;
}

.college-info .profile-log img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit:contain;
}
.nav-submenu-icon{
font-size:20px;
margin-left:5px;
}
.college-info .profile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
 .sub-menu{
    background-color:rgb(243, 241, 241);
 }
.move-inside:hover{
 background-color:transparent !important;
}
 #sub-menu-dropdown i {
  font-size:20px;
  margin-left:5px
 }
  .menu-item-margin {
    margin: 8px 0;
}
`;
  const navbar = `<section
          class=" d-flex justify-content-between flex-column position-relative"
        >
          <div class="d-flex gap-3  flex-column" id="side-nav-bar">
            <div
              class="hamburger-container d-flex justify-content-center align-items-center mt-3"
            >
              <i class='bx bx-menu' id="menu-list"></i>
            </div>
            <i class='bx bx-chevron-left' id="toggle-menu"></i>
            <div class="college-info d-flex flex-column align-items-center mb-3">
              <div class="profile-log">
                <img
                  src="${getCollegeLogo}"
                  alt=""
                  id="college-logo"
                  onerror="this.src='../../common/imgs/school.png'"
                />
              </div>
              <div class="text-center mt-2">
                <div class="profile-name" id="college-name">${getCollegeName}</div>
              </div>
            </div>
            <div id="menus">
            <div class="main-menu">
               <ul>
                ${
                  hasAdminPrivileges()
                    ? `<li id="acc-item" class="menu-item d-flex align-items-center">
                  <a  href="../account-management/index.html" id="acc-href"> 
                    <span class="menu-icon"><i class='bx bx-cog'></i></span>
                    <span class="menu-text common-label-account_management">Account Management</span>
                    <div id="sub-menu-dropdown"><i class='bx bx-chevron-down nav-submenu-icon' ></i></div>
                   <div id="sub-menu-up"><i class='bx bx-chevron-up nav-submenu-icon'></i></div>`
                    : ""
                }
                  </a>
                 </li>
                 <div class="sub-menu rounded-bottom" id="sub-menu">
              </div>
                 ${
                   isAccountAdminOnly()
                     ? ""
                     : `<li class="menu-item d-flex align-items-center  bg-lite-green">
                  <a href="../exam-list/index.html" id="exam-maker-href"> 
                    <span class="menu-icon"><i class='bx bx-notepad'></i></span>
                    <span class="menu-text">Exam Maker</span>
                  </a>
                 </li>
                 <li class="menu-item d-flex align-items-center">
                  <a href="../exam-configure/create.html?stepper=1" id="create-exam-href"> 
                    <span class="menu-icon"><i class='bx bx-plus-circle'></i></span>
                    <span class="menu-text">Create <span class=common-label-exam>Exam</span></span>
                  </a>
                 </li>
                 <li class="menu-item d-flex align-items-center">
                  <a href="../student-management/index.html" id="stu-href"> 
                    <span class="menu-icon"><i class='bx bx-user-circle'></i></span>
                    <span class="menu-text">Student Management</span>
                    <div id="student-sub-menu-dropdown"><i class='bx bx-chevron-down nav-submenu-icon'></i></div>
                    <div id="student-sub-menu-up"><i class='bx bx-chevron-up nav-submenu-icon'></i></div>
                  </a>
                 </li>
                 <div class="sub-menu rounded-bottom" id="student-sub-menu">
                 </div>
                 <li class="menu-item d-flex align-items-center">
                  <a href="../register-student.html?cid=${localStorage.getItem(
                    "collegeCode"
                  )}" id="register-student-href"> 
                    <span class="menu-icon"><i class='bx bx-user-check'></i></span>
                    <span class="menu-text">Register Student</span>
                  </a>
                 </li>
                 ${
                   enableInsight == "true"
                     ? `<li class="menu-item d-flex align-items-center">
                  <a href="../insights/index.html" id="insights-href"> 
                    <span class="menu-icon"><i class='bx bx-bar-chart'></i></span>
                    <span class="menu-text">Insights</span>
                  </a>
                 </li>`
                     : ""
                 }
                 <li class="menu-item d-flex align-items-center">
                  <a href="../../fullscreenexam/activity-log/index.html" id="register-student-href"> 
                    <span class="menu-icon"><i class="fas fa-clipboard-list"></i></span>
                    <span class="menu-text">Activity log</span>
                  </a>
                 </li>`
                 }
                 <li class="menu-item d-flex align-items-center">
                  <a href="../paper-scan/copy-scanner.html" id="stu-href"> 
                    <span class="menu-icon"><i class='bx bx-qr'></i></span>
                    <span class="menu-text">Paper Scanner tool</span>
                  </a>
                 </li>
               </ul>
             </div>
            
          </div>
        </section>`;
  $("#nav-section-menu").html(navbar);
  const styleTag = $("<style>").text(style);
  $("head").append(styleTag);
  $("#menu-list").on("click", function () {
    $(".nav-bar").addClass("expanded");
    $("#menu-list").hide();
    $("#toggle-menu").css({ opacity: 1 });
  });
  $("#toggle-menu").on("click", function () {
    $(".nav-bar").removeClass("expanded");
    $("#menu-list").show();
    $("#toggle-menu").css({ opacity: 0 });
    $("#sub-menu").empty();
    $("#sub-menu-dropdown").show();
    $("#sub-menu-up").hide();
    $("#student-sub-menu").empty();
    $("#student-sub-menu-dropdown").show();
    $("#student-sub-menu-up").hide();
  });

function setActiveMenu(currentPath) {
  const routeMap = {
    "student-management": "stu-href",
    "account-management": "acc-href",
    "exam-taker": "exam-href",
    "exam-configure": "create-exam-href",
    "exam-list": "exam-maker-href",
    "add-student": "add-student-href",
    "register-student": "register-student-href",
    "insights":"insights-href"
  };

  // Clear all menu highlights
  Object.values(routeMap).forEach(id => {
    $(`#${id}`).parent().removeClass("active-menu bg-lite-green");
  });

  // Activate the matching one
  for (const route in routeMap) {
    if (currentPath.includes(route)) {
      $(`#${routeMap[route]}`).parent().addClass("active-menu bg-lite-green");
      break;
    }
  }
}

  // Set active menu based on current page
  const currentPath = window.location.pathname;
  setActiveMenu(currentPath)
});

$(document).ready(function () {
  // Function to show sub-menu
  function showSubMenu() {
    if (isAccountAdminOnly()) {
      $("#sub-menu").append(`<ul >
        <li class=" d-flex align-items-center mx-3  bg-lite-green move-inside" onclick="handleMenu(1,'subMenu')"  >
          <a > 
            <span class="menu-icon"><i class="bx bx-home-alt" ></i></span>
            <span class="menu-text">Dashboard</span>
          </a>
        </li>
        <li class=" d-flex align-items-center mx-3  move-inside  bg-lite-green" onclick="handleMenu(3,'subMenu')"  >
          <a > 
            <span class="menu-icon"><i class="bx bx-credit-card"></i></span>
            <span class="menu-text">Credits Dashboard</span>
          </a>
        </li>
      </ul>`);
    } else {
      $("#sub-menu").append(`<ul >
        <li class=" d-flex align-items-center mx-3  bg-lite-green move-inside menu-item-margin" onclick="handleMenu(1,'subMenu')"  >
          <a > 
            <span class="menu-icon"><i class="bx bx-home-alt" ></i></span>
            <span class="menu-text">Dashboard</span>
          </a>
        </li>
        <li class=" d-flex align-items-center mx-3  move-inside  bg-lite-green menu-item-margin" onclick="handleMenu(2,'subMenu')"  >
          <a > 
            <span class="menu-icon"><i class="bx bx-video"></i></span>
            <span class="menu-text">Video management</span>
          </a>
        </li>
        ${
          hasAdminPrivileges()
            ? `<li class=" d-flex align-items-center mx-3  move-inside  bg-lite-green menu-item-margin" onclick="handleMenu(3,'subMenu')"  >
                <a > 
                  <span class="menu-icon"><i class="bx bx-credit-card"></i></span>
                  <span class="menu-text">Credits Dashboard</span>
                </a>
              </li>`
            : ""
        }
        <li class=" d-flex align-items-center mx-3  move-inside  bg-lite-green menu-item-margin" onclick="handleMenu(4,'subMenu')"  >
          <a > 
            <span class="menu-icon"><i class="bx bx-book"></i></span>
            <span class="menu-text">Course & Grade & Certificate</span>
          </a>
        </li>
      </ul>`);
    }
    $("#sub-menu-dropdown").hide();
    $("#sub-menu-up").show();
  }

  // Click handler for the dropdown icon
  $("#sub-menu-dropdown").on("click", function (event) {
    event.preventDefault();
    showSubMenu();
  });

  $("#sub-menu-up").hide();
  $("#sub-menu-up").on("click", function (event) {
    event.preventDefault();
    $("#sub-menu").empty();
    $("#sub-menu-dropdown").show();
    $("#sub-menu-up").hide();
  });
});

$(document).ready(function () {
  const enableGroupCreation =
    localStorage.getItem("enableGroupCreation") || false;

  $("#student-sub-menu-dropdown").on("click", function (event) {
    event.preventDefault();
    $("#student-sub-menu").append(`<ul >
      ${
        enableGroupCreation == "true"
          ? `<li class=" d-flex align-items-center mx-3  bg-lite-green move-inside menu-item-margin" onclick="window.location.href = '../student-management/group.html'" >
        <a > 
          <span class="menu-icon"><i class="bx bx-group"></i></span>
          <span class="menu-text">Groups</span>
        </a>
      </li>`
          : ""
      }
      <li class=" d-flex align-items-center mx-3  move-inside  bg-lite-green menu-item-margin" onclick="window.location.href = '../student-management/index.html'"  >
        <a > 
          <span class="menu-icon"><i class="bx bx-user-pin"></i></span>
          <span class="menu-text">Student Data</span>
        </a>
      </li>
    </ul>`);
    $("#student-sub-menu-dropdown").hide();
    $("#student-sub-menu-up").show();
  });

  $("#student-sub-menu-up").hide();
  $("#student-sub-menu-up").on("click", function (event) {
    event.preventDefault();
    $("#student-sub-menu").empty();
    $("#student-sub-menu-dropdown").show();
    $("#student-sub-menu-up").hide();
  });
});

function getAccountDetails() {
  const accountId = localStorage.getItem("accountId");
  if (!accountId) {
    return;
  }

  makeApiCall({
    url: `${ACCOUNT_END_POINT}?accountId=${accountId}`,
    method: "GET",
    successCallback: (response) => {
      const enabledFeatures = response?.data[0]?.settings?.features;
      const [enableGroupCreation, enableInsight] = [
        enabledFeatures?.enableGroupCreation,
        enabledFeatures?.enableInsight,
      ];
      localStorage.setItem("enableInsight", enableInsight || false);
      localStorage.setItem("enableGroupCreation", enableGroupCreation || false);
    },
    errorCallback: (error) => {
      console.error("Error fetching college details:", error);
    },
  });
}
