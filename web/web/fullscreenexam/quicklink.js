setTimeout(() => {
  $(document).ready(function () {
    //variables and initial function calling
    renderLanguage("./dashboardLanguage/");

    $("#lang-toggle").change(function () {
      changeLanguage();
    });

    const portalData = [
      {
        icon: "user",
        title: globalLabels?.[labelItems.ACCOUNT_MANAGEMENT] ?? "Account Management",
        desc: globalLabels?.[labelItems.ACCOUNT_MANAGEMENT_DESCRIPTION] ?? "For super admin and college admin to manage user accounts",
        routes: [
          {
            icon: "users-cog",
            title: "Account Management",
            path: "/fullscreenexam/account-management/index.html",
          },
        ],
      },
      {
        icon: "pen-to-square",
        title: globalLabels?.[labelItems.EXAM_MAKER] ?? `${globalLabels[labelItems.EXAME] ?? "Exam"} Maker`,
        desc: globalLabels?.[labelItems.EXAM_MAKER_DESCRIPTION] ?? "For faculty to create and manage assessment",
        routes: [
          {
            icon: "clipboard-list",
            title: "Account Management",
            path: "/fullscreenexam/exam-list/index.html",
          },
        ],
      },
      {
        icon: "graduation-cap",
        title: globalLabels?.[labelItems.EXAM_TAKER] ?? `${globalLabels[labelItems.EXAME] ?? "Exam"} Taker`,
        desc: globalLabels?.[labelItems.EXAM_TAKER_DESCRIPTION] ?? "For students to access and write exams",
        routes: [
          {
            icon: "pen-to-square",
            title: "Account Management",
            path: "/fullscreenexam/app-landing",
          },
        ],
      },
    ];

    const portalDataArabic = [
      {
        icon: "user",
        title: "إدارة الحسابات",
        desc: "للمشرف الأعلى وإدارة الكلية لإدارة حسابات المستخدمين",
        routes: [
          {
            icon: "users-cog",
            title: "إدارة الحسابات",
            path: "/fullscreenexam/account-management/",
          },
        ],
      },
      {
        icon: "pen-to-square",
        title: "صانع الاختبارات",
        desc: "لأعضاء هيئة التدريس لإنشاء الاختبارات وإدارتها",
        routes: [
          {
            icon: "clipboard-list",
            title: "قائمة الاختبارات",
            path: "/fullscreenexam/exam-list",
          },
        ],
      },
      {
        icon: "graduation-cap",
        title: "أداء الاختبارات",
        desc: "للطلاب للوصول إلى الاختبارات وأدائها",
        routes: [
          {
            icon: "pen-to-square",
            title: "واجهة التطبيق",
            path: "/fullscreenexam/app-landing",
          },
        ],
      },
    ];

    const role = localStorage.getItem("role");
    const accountAdmin = localStorage.getItem("accountAdmin");

    function getLang(lang) {
      const isArabic = lang === "ar";
      const dataSource = isArabic ? portalDataArabic : portalData;
      const accountManagementTitle = isArabic
        ? "إدارة الحسابات"
        : "Account Management";
      const examMakerTitle = isArabic ? "صانع الاختبارات" : "Exam Maker";
      const examTakerTitle = isArabic ? "أداء الاختبارات" : "Exam Taker";
      const titleText = isArabic ? "نجعل إجراء الامتحانات بسيطًا وآمنًا!" : `we make ${globalLabels[labelItems.EXAM] ?? "exam"} conduction simple and secure!`
      $(".header-card").find("P").text(titleText)
      
      return dataSource.filter((item) => {
        // If accountAdmin is true
        if (accountAdmin === "true") {
          // If accountAdmin is true and role is admin, show all options
          if (role === ADMIN || role === SUPERADMIN) {
            return true;
          }
          // If accountAdmin is true but role is not admin, only show Account Management
          else {
            return item.title === accountManagementTitle;
          }
        }
        // // If role is faculty, show only Exam Maker and Exam Taker
        // else if (role === FACULTY) {
        //   return item.title === examMakerTitle || item.title === examTakerTitle;
        // }
        // else if (role === ADMIN) {
        //   return item.title === accountManagementTitle;
        // }
        else if (role === SUPERADMIN) {
          return true;
        }
        // Original logic for other cases
        else {
          if (item.title === accountManagementTitle) {
            return role === ADMIN || role === SUPERADMIN;
          }
          return true;
        }
      });
    }

    getCollegeDetails();
    function changeLanguage() {
      pushQuickCards(getLang(localStorage.getItem("lang")));
      const titleText = isArabic ? "نجعل إجراء الامتحانات بسيطًا وآمنًا!" : `we make ${globalLabels[labelItems.EXAM] ?? "exam"} conduction simple and secure!`
      $(".header-card").find("P").text(titleText)
    }
    pushQuickCards(getLang(localStorage.getItem("lang")));
    setCollegeDetails();

    // Add hover effects for portal cards
    $(document).on("mouseover", ".portal-card", function () {
      // Add custom animation class
      $(this).addClass("card-hover");
    });

    $(document).on("mouseout", ".portal-card", function () {
      // Remove custom animation class
      $(this).removeClass("card-hover");
    });

    // Add pulse animation to login button
    setInterval(function () {
      $(".login-btn").toggleClass("pulse");
    }, 2000);
  });
}, 100);

function pushQuickCards(portalData) {
  const portalGrid = $(".portal-grid");
  portalGrid.empty();

  // Create portal cards with staggered animation
  portalData.forEach((item, index) => {
    const card = $(`
      <a class="portal-card" href=${item.routes[0].path
      } target="_blank" style="animation-delay: ${index * 0.2}s">
        <div class="card-content">
          <i class="fas fa-${item.icon}"></i>
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
        </div>
      </a>
    `);

    portalGrid.append(card);
  });
}

function getCollegeDetails() {
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
      const collegeName = response.data.name;
      const logoUrl = response?.data?.settings?.logo.url;

      $(".college-info img").attr("src", logoUrl);
      $(".college-name").text(collegeName);

      localStorage.setItem("enableInsight", enableInsight || false);
      localStorage.setItem("enableGroupCreation", enableGroupCreation || false);
    },
    errorCallback: (error) => {
      console.error("Error fetching college details:", error);
    },
  });
}
