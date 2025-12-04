let collegeData = [];
$(document).ready(function () {
  function addDynamicStyles() {
    const styles = `
    <style>
    *{
    margin:0;
    padding:0;
    }
    
    .main-content.hidden {
       display: none;
      }
      :root {
        --primary: #1877f2;
        --primary-light: #1877f2;
        --text: #2d3748;
        --text-grey: #718096;
      }

      #login-form {
        width: 100%;
        margin: 0 auto;
        padding: 2rem 1rem;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #f8faff 0%, #f0f7ff 100%);
        font-family: "Inter", system-ui, -apple-system, sans-serif;
        position: relative;
        z-index: 1000;
      }

      body.login-active #particles-js {
        display: none !important;
      }

      #login-form .step {
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      #login-form .step.active {
        display: block;
        opacity: 1;
      }

      #login-form .login-card#step1 {
        backdrop-filter: blur(8px);
        padding: 2rem;
        width: 600px;
        margin-bottom: 2rem;
      }

      #login-form .login-title {
        text-align: start;
      }

      #login-form .input-group {
        margin-bottom: 1.5rem;
      }

      #login-form .input-wrapper {
        position: relative;
        margin-bottom: 1rem;
      }

      #login-form .input-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-grey);
        z-index: 1;
      }

      #login-form input {
        width: 100%;
        padding: 12px;
        border-radius: 8px;
        font-size: 1rem;
        padding-left: 40px !important;
        padding-right: 40px !important;
      }

      #login-form .header-left {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      #login-form input.welcome-login {
        width: 100%;
        height: 50px;
        padding: 8px;
        border: 1px solid #abb2bc !important;
        border-radius: 8px;
        font-size: 1rem;
        padding-left: 20px !important;
        padding-right: 40px !important;
      }

      #login-form .suggestions {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-top: 0.5rem;
        max-height: 150px;
        overflow-y: auto;
      }

      #login-form .college-details {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        text-align: center;
        margin: -1rem auto 2rem;
        width: 100%;
      }

      #login-form .college-logo {
        padding: 8px;
        max-width: 160px;
        max-height: 100px;
      }

      #login-form .college-info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
      }

      #login-form #collegeName {
        font-size: 20px;
        color: var(--text);
        margin: 0;
      }

      #login-form .college-code {
        color: var(--text-grey);
        font-size: 0.9rem;
      }

      #login-form .product-names {
        margin-bottom: 0.5rem;
        text-align: center;
      }

      #login-form #step1-submit {
        width: content-fit;
        padding: 10px 15px;
        font-size: 16px;
        background-color: var(--primary);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      #login-form #step1-submit img {
        width: 17.5px;
        height: 15px;
      }

      #login-form button {
        font-size: 16px;
        background-color: var(--primary);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      #login-form button:hover {
        background-color: color-mix(in srgb, var(--primary) 90%, black);
        box-shadow: 0 4px 12px rgba(24, 119, 242, 0.2);
      }

      #login-form button:active {
        background-color: color-mix(in srgb, var(--primary) 85%, black);
        transform: scale(0.98);
      }

      #login-form button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.3);
      }

      #login-form .back-link {
        text-align: center;
        margin-top: 1rem;
      }

      #login-form .back-link a {
        color: var(--text-grey);
        text-decoration: none;
        font-size: 0.9rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: color 0.2s ease;
      }

      #login-form .back-link a:hover {
        color: var(--primary);
      }

      #login-form .back-link i {
        font-size: 0.8rem;
        transition: transform 0.2s ease;
      }

      #login-form .back-link a:hover i {
        transform: translateX(-2px);
      }

      #login-form .college-code-card {
        backdrop-filter: blur(8px);
        border-radius: 16px;
        padding: 0.5rem;
        width: 100%;
      }

      #login-form .product-names {
        color: var(--primary);
        font-size: 36px;
        font-weight: 700;
        white-space: nowrap;
      }

      #login-form .college-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      #login-form #collegeName {
        font-size: 1.25rem;
        margin: 0;
        color: var(--text);
      }

      #login-form .college-code {
        font-size: 0.875rem;
        color: var(--text-grey);
      }

      #login-form .access-message {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      #login-form .access-message h2 {
        font-size: 1.5rem;
        color: var(--text);
        margin-bottom: 0.5rem;
      }

      #login-form .access-message p {
        color: var(--text-grey);
        font-size: 0.95rem;
      }

      #login-form #backtostep1 {
        border: 2px solid #D1D5DB;
        background-color: transparent;
        color: var(--text);
        cursor: pointer;
      }

      #login-form #backtostep1:hover {
        color: var(--text-grey);
        transition: color 0.3s ease;
      }

      #login-form .admin-login {
        display: flex;
        gap: 5px;
        color: var(--primary);
        justify-content: center;
        align-items: center;
        cursor: pointer;
        font-size: small;
        font-weight: 600;
      }

      #login-form .admin-login:hover {
        color: #1459b4;
        transition: color 0.3s ease;
      }

      #login-form .custom-dropdown {
        position: absolute;
        width: calc(100% - 259px);
        top: calc(100% + -45px);
        left: 74px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: none;
        max-height: 200px;
        overflow-y: auto;
      }

      #login-form .dropdown-item {
        padding: 10px;
        cursor: pointer;
        transition: background 0.2s;
      }

      #login-form .dropdown-item:hover {
        background: #f5f5f5;
      }

      #login-form .toggle-password {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-grey);
        cursor: pointer;
        z-index: 2;
      }

      #login-form .toggle-password:hover {
        color: var(--primary);
      }

      #login-form .error-message {
        color: #dc3545;
        padding: 8px 12px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        margin: 1rem 0;
        display: none;
        font-size: 0.9rem;
      }

      #login-form .error-message.show {
        display: block;
      }

      /* Full-screen container */
      #login-form .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: linear-gradient(to bottom, #f8faff, #e5efff);
        position: relative;
        overflow: hidden;
      }

      .login-container  >label{
        position: absolute;
        top: 15px;
        right: 80px;
    
      }

     

      .login-container::before{
        content: "";
        position: absolute;
        background-image: linear-gradient(to top, #147AFC 0%, #FFFFFF 100%);
        border-radius: 50%;
      }

      .login-container::before {
          width: 318px;
          height: 250px;
          top: -150px;
          right: 86px;
          border: 1px solid #ffffff;
          box-shadow: 0 27px 91px -14px rgba(20, 122, 252, 0.4);
      }

      .login-container::after {
       content: "";
        position: fixed;
          width: 150px;
          height: 150px;
          bottom:-70px;
          left: 122px;
           border-radius: 50%;
          border: 1px solid #E6F1FF;
          box-shadow: 0 4px 3px 3px rgba(20, 122, 252, 0.3);
          background-image: linear-gradient(to bottom, #a8cefe, #FFFFFF 65%);
      }


      #login-form .login-content {
        text-align: center;
        max-width: 400px;
        background: white;
        padding: 40px;
      }

      #login-form h1 {
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }

      #login-form .highlight {
        color: #007bff;
      }

      #login-form .input-wrapper {
        display: flex;
        margin-top: 14px;
        border: 2px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      }

      #login-form input {
        flex: 1;
        padding: 12px;
        border: none;
        font-size: 16px;
        outline: none;
      }

       #login-form button {
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 60px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;
      }

      #login-form button:hover {
        background: #0056b3;
      }

      #login-form .error-message {
        color: red;
        font-size: 14px;
        margin-top: 10px;
      }

      #login-form .welcome-code {
        font-size: 2rem;
        font-weight: 700;
        white-space: nowrap;
        text-align: center;
      }

      #login-form .d-flex {
        display: flex;
        gap: 10px;
        flex-warp:wrap;
      }

      @media (max-width: 1500px) {
          #login-form .form-container{
          padding : 15px !important;

        }
          #login-form .input-wrapper{
          margin-bottom : 5px !important;
          margin-top : 5px !important;
        }
      }
      @media (max-width: 1440px) {
        #login-form .form-container{
          padding : 15px !important;
          flex: 0 0 40% !important;
        }
        #login-form .input-wrapper{
          margin-bottom : 5px !important;
          margin-top : 5px !important;
        }
      }
      @media (max-width: 1028px) {
        #login-form .welcome-code {
          font-size: 1.5rem;
        }
          #login-form .product-names{
          font-size: 1.5rem;
          }
          #login-form .access-message p{
            font-size:0.85rem;
          }

            #login-form .custom-dropdown {
                position: absolute;
                width: calc(100% - 146px);
                top: calc(100% + -73px);
                left: 30px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                display: none;
                max-height: 200px;
                overflow-y: auto;
            }
            #login-form .form-container{
              padding: 15px !important;
              flex: 0 0 40% !important;
            }
              #login-form .input-wrapper{
                margin-bottom : 1px !important;
                margin-top : 1px !important;
              }
              #login-form .action-buttons{
                margin-top : 1px !important;
              }
              #login-form .header-left{
              padding : 2px !important
            }
            #login-form button{
              padding: 10px 45px !important;
            }
      }

      @media (max-width: 768px) {
        #login-form .welcome-code {
          font-size: 1.25rem;
        }
            #login-form .product-names{
          font-size: 1.25rem;
          }
            #login-form .access-message p{
              font-size:0.75rem;
          }

          #login-form .custom-dropdown {
              position: absolute;
              width: calc(100% - 190px);
              top: calc(100% + -265px);
              left: 92px;
              background: #fff;
              border: 1px solid #ddd;
              border-radius: 4px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              z-index: 1000;
              display: none;
              max-height: 200px;
              overflow-y: auto;
            }
              #login-form .form-container{
              padding: 15px !important;
              flex: 0 0 50% !important;
            }
            #login-form button{
              padding: 10px 35px !important;
            }
      }

      @media (max-width: 480px) {
        #login-form .welcome-code {
          font-size: 1rem;
        }
            #login-form .product-names{
          font-size: 1rem;
          }
            #login-form .access-message p{
                font-size:0.65rem;
          }

          #login-form .custom-dropdown {
              position: absolute;
              width: calc(100% - 193px);
              top: calc(100% + -266px);
              left: 92px;
              background: #fff;
              border: 1px solid #ddd;
              border-radius: 4px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              z-index: 1000;
              display: none;
              max-height: 200px;
              overflow-y: auto;
          }
                .image-container{
                  display : none !important;
                }
                  #login-form .login-layout{
                    display : block !important;
                    height : 85vh !important;
                  }
              #login-form button{
                padding: 10px 35px !important;
              }
          }

          /* Base grid layout */
          #login-form .grid-container {
            display: grid;
            grid-template-columns: 0.8fr auto; /* Input takes most space, button is auto-sized */
            gap: 10px;
            align-items: center;
            justify-content: center;
          }

          /* Input styling */
          #login-form .welcome-login {
            width: 100%;
            padding: 10px;
            font-size: 1rem;
          }

          /* Button styling */
          #login-form #step1-submit {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 15px;
            font-size: 1rem;
            cursor: pointer;
            white-space: nowrap;
          }

          /* Dropdown spans full width */
          #login-form .custom-dropdown {
            grid-column: span 2; /* Makes dropdown take full width */
          }

          /* Add this to your existing CSS */
          .login-container.hide-pseudo::before,
          .login-container.hide-pseudo::after {
            display: none;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            #login-form .grid-container {
              grid-template-columns: 0.7fr; /* Stack items vertically */

            }

            #login-form #step1-submit {
              width: 100%; /* Make button full width */
            }
          }

      /* Add this to your existing CSS */
      #login-form .login-layout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100vh;
      }

      #login-form .image-container {
          flex: 1; /* Adjusts the width of the image container */
          display: flex;
          justify-content: center;
          align-items: center;
      }

      #login-form .image-container img {
          max-width: 100%; /* Ensures the image is responsive */
          height: auto; /* Maintains aspect ratio */
      }

    #login-form .form-container {
        min-height: 80vh;       
        height: auto;           
        max-height: 90vh;       
        flex: 0 0 30%;
        padding: 30px;
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start; 
        box-shadow: 0px 12px 48px 0px #BFBFBF33;
        border-radius: 25px;
        background-color: white;
        box-sizing: border-box;
        overflow: hidden;
    }

      .login-card {
          display: flex;
          flex-direction: column;
          width: 100%; /* Ensures the card takes full width */
      }

      #login-form .action-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
      }

      #login-form .login-button {
        background-color: #007bff; /* Blue background for login button */
        color: white; /* White text */
      }

      #login-form .login-button:hover {
        background-color: #0056b3; /* Darker blue on hover */
      }

      #login-form .login-text {
        color: #4B5563;
        font-size: 16px;
      }

      #login-form .forgot-password-container {
        text-align: right;
        margin-top: 0.5rem;
        margin-bottom: 1rem;
      }

      #login-form .forgot-password-link {
        color: var(--primary);
        font-size: 0.85rem;
        text-decoration: none;
        transition: color 0.2s ease;
      }

      #login-form .forgot-password-link:hover {
        color: color-mix(in srgb, var(--primary) 85%, black);
        text-decoration: underline;
      }
      </style>
        `;
    $("head").append(styles);
    const rtlStyles = `
      body[dir="rtl"] #login-form .custom-dropdown {
        left: auto !important;
        right: 74px !important;
        text-align: right;
        direction: rtl;
      }`;
      $("head").append(`<style>${rtlStyles}</style>`);
  }

  function checkSession() {
    const accessToken = localStorage.getItem("access");
    const refreshToken = localStorage.getItem("refresh");
    const accountId = localStorage.getItem("accountId");
    const collegeCode = localStorage.getItem("collegeCode");

    if (accessToken && refreshToken && collegeCode) {
      $(".main-content").removeClass("hidden");
      $("#login-form").remove();
      $("body").removeClass("login-active");
    } else {
      fetchCollegeCode();
      $(".main-content").addClass("hidden");
      showLoginForm();
    }
  }

  async function validateLogin(username, password, college) {
    const url = base_url + "/user/login";
    const data = new URLSearchParams();
    data.append("email", username);
    data.append("password", password);

    // Only add accountId for non-admin logins
    if (college && !college.isAdmin) {
      data.append("accountId", college._id);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: data.toString(),
      });

      const result = await response.json();

      if (response.status !== 200) {
        const errorMessage =
          result.errors && result.errors.length > 0
            ? result.errors[0].msg
            : "Username or password is invalid.";
        $("#step2-error").text(errorMessage).addClass("show");
        $("#login-button").text("Login");
        return false;
      }

      localStorage.setItem("access", result.data.token.access.token);
      localStorage.setItem("refresh", result.data.token.refresh.token);
      localStorage.setItem("mail", username);
      localStorage.setItem("role", result.data.role);
      if(result?.data?.isAccountAdmin){
        localStorage.setItem("accountAdmin", result?.data?.isAccountAdmin);
      }
      localStorage.setItem("collegeCode", college.code);
      localStorage.setItem("collegeName", college.name);
      localStorage.setItem("collegeLogo", college.settings?.logo?.url);

      $("#login-button").text("Login");
      $("body").removeClass("login-active");
      return true;  
    } catch (error) {
      $("#login-button").text("Login");
      $("#step2-error").text("Error during authentication.").addClass("show");
      return false;
    }
  }



  window.showLoginForm = function () {
    //variables and function calling
    let college;
    const storedLogo = localStorage.getItem("collegeLogo");
    const loginFormHtml = `
    
    
          <div id="login-form" class="login-container">

          <label class="toggle-switch-lang">
            <input id="lang-toggles" type="checkbox" />
            <span class="slider"></span>
        </label> 
         
              <!-- College Code Step -->
              <div class="login-card step active" id="step1">
                  <div class="welcome-code">
                      <span class="welcome-text">Welcome  the </span><span class="product-names common-label-screener">Screener</span> <span class="welcome-text-portal">Portal!</span>
                  </div>
                  <div class="access-message">
                      <p class="access-message-text">Enter your college code. Let's get started!</p>
                  </div>
                   <div class="mx-5 mb-1 fw-bold "><label for="collegeCode" class="collegeCode">College Code</label><span class="text-danger">*</span></div>
                  <div class="grid-container">
                    <form id="college-code-form" autocomplete="off" name="college-code-form" >
                      <input 
                          type="text" 
                          class="welcome-login" 
                          id="collegeCode" 
                          placeholder="College code" 
                          autocomplete="off" 
                          name="college-code"
                      />
                    </form>
                      <button type="button" id="step1-submit">
                          <span id="go">Go</span> 
                          <span>
                              <img src=${getDynamicImagePath(
                                "send.png"
                              )} alt="Send">
                          </span>
                      </button>
                      <div class="custom-dropdown" id="collegeDropdown"></div>
                  </div>
              
            <div id="step1-error" class="error-message"></div>
            
            <div class="action-buttons">
            </div>

        </div>

        <!-- Login Credentials Step -->
        <div class="login-card step" id="step2">
            <div class="login-layout">
                <div class="image-container">
                    <img src=${getDynamicImagePath(
                      "logscreen.svg" 
                    )} alt="Description of Image" />
                </div>
                <div class="form-container">
                    <div class="college-code-card">
                        <div class="college-code-card-header">
                            <div class="header-left">
                                <img src=${getDynamicImagePath(
                                  "school.png"
                                )} alt="College Logo" class="college-logo" onerror="this.src='${getDynamicImagePath(
                                  "school.png"
                                )}'">
                                <div class="college-info">
                                    <h2 id="collegeName">College Name</h2>
                                    <div class="login-text">Login to your account</div>
                                    <div class="college-code"><span id="college-code-text">Code:</span> <span id="displayCollegeCode"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label><span class="login-email">Email Address</span> <span class="text-danger">*</span></label>
                        <div class="input-wrapper">
                            <i class="fas fa-envelope input-icon"></i>
                            <input type="email" id="login-email" placeholder="Email address">
                        </div>
                         <label><span class="password">Password</span><span class="text-danger">*</span></label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock input-icon"></i>
                            <input type="password" id="password" placeholder="Password">
                            <i class="fas fa-eye toggle-password" style="cursor: pointer"></i>
                        </div>
                        <div class="forgot-password-container">
                            <a href="#" id="forgot-password" class="forgot-password-link">Forgot Password?</a>
                        </div>
                    </div>
                    <div id="step2-error" class="error-message"></div>
                   
                    <div class="action-buttons">
                        <button id="backtostep1" class="back-button">
                            Back
                        </button>
                        <button id="login-button" class="login-button">Login</button>
                    </div>
                </div>
            </div>
        </div>

        <footer>
            <p>&copy; 2025 Digi Screener. All rights reserved.</p>
        </footer>
    </div>
        `;
    // checkCollegeCode();

    let mainLayout = `
    <div> 
    
      ${loginFormHtml}
    </div>
    ` 

    $("body").append(mainLayout);
    $(".college-logo").attr("src", storedLogo);
    $("body").addClass("login-active");
    $("#login-form").show();
    $("footer").hide();
    $(document).on("click", ".toggle-password", function () {
      const icon = $(this);
      const passwordInput = icon.siblings("input");
      const isPassword = passwordInput.attr("type") === "password";

      passwordInput.attr("type", isPassword ? "text" : "password");
      icon.toggleClass("fa-eye fa-eye-slash");
    });

    // Add forgot password event handler
    $("#forgot-password").on("click", function (e) {
      e.preventDefault();

      const email = $("#login-email").val().trim();
      const getData = $("#login-button").attr("data-college");

      if (!email) {
        $("#step2-error")
          .text("Please enter your email address")
          .addClass("show");
        return;
      } else if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email.trim())) {
  $("#step2-error")
    .text("Please enter a valid email.")
    .addClass("show");
  return;
}


      const college = JSON.parse(getData);
      const accountId = college._id;

      // Show processing state
      $("#forgot-password").text("Processing...");
      $("#step2-error").removeClass("show");

      // Call forgot password API
      $.ajax({
        url: `${USER_END_POINT}/forgot-password`,
        method: "PUT",
        headers: apiHeaders,
        data: JSON.stringify({
          email: email,
          accountId: accountId,
        }),
        contentType: "application/json",
        success: function (response) {
          // Reset button text
          $("#forgot-password").text("Forgot Password?");

          // Show success message
          $("body").append(`
            <div id="password-reset-modal" style="
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
            ">
              <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
              ">
                <h3 style="margin-bottom: 15px; color: var(--primary);">Password Reset Email Sent</h3>
                <p style="margin-bottom: 20px;">Please check your email inbox. We've sent instructions to reset your password to ${email}.</p>
                <button id="close-reset-modal" style="
                  background: var(--primary);
                  color: white;
                  border: none;
                  padding: 10px 25px;
                  border-radius: 5px;
                  cursor: pointer;
                  font-weight: 500;
                ">Close</button>
              </div>
            </div>
          `);

          // Handle close button
          $("#close-reset-modal").on("click", function () {
            $("#password-reset-modal").remove();
          });
        },
        error: function (xhr) {
          $("#forgot-password").text("Forgot Password?");

          // Get error message from response
          let errorMessage = "An error occurred while processing your request.";

          if (xhr.responseJSON) {
            errorMessage = xhr.responseJSON.message || errorMessage;
          }

          // Show error message to user
          $("#step2-error").text(errorMessage).addClass("show");
        },
      });
    });

    $("#login-button").on("click", async function () {
      const username = $("#login-email").val();
      const password = $("#password").val();

      // Clear errors
      $(".error-message").removeClass("show").text("");

      // Validate inputs
      if (!username) {
        $("#step2-error")
          .text("Email must not be empty.")
          .addClass("show");
        return;
      }else if (! /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(username.trim())) {
        $("#step2-error")
          .text("Please enter a valid email address.")
          .addClass("show");
       return;
      }
      if (!password) {
        $("#step2-error")
          .text("Password must not be empty.")
          .addClass("show");
        return;
      }

      const getData = $("#login-button").attr("data-college");
      college = JSON.parse(getData);

      const loginSuccess = await validateLogin(username, password, college);

      if (loginSuccess) {
        // Always store college code and name for both admin and regular users
        localStorage.setItem("collegeCode", college.code);
        localStorage.setItem("collegeName", college.name);

        // Store account ID only for regular colleges
        if (!college?.isAdmin) {
          localStorage.setItem("accountId", college._id);
        }

        // Set admin flag if applicable
        if (college?.isAdmin) {
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("primaryColor", "#1877f2"); // Default admin color
        } else {
          localStorage.setItem(
            "primaryColor",
            college.settings?.colors?.primary || "#1877f2"
          );
        }

        window.location.reload();
        $(".main-content").removeClass("hidden");
        $("#login-form").remove();
        $("#error-message").text("").removeClass("show");
        $("footer").show();
      }
    });

    //events
    $("#step1-submit").on("click", handleCollegeCode);
    $("#backtostep1").on("click", function () {
      $("#password").val("");
      $("#login-email").val("");
      localStorage.clear();
      document.documentElement.style.setProperty("--primary", "#1877f2");
      document.documentElement.style.setProperty("--primary-light", "#e7f3ff");
      switchStep(1);
    });
    $(".admin-login").on("click", () => switchStep(2));
    $("#collegeCode").on("input", function () {
      const searchTerm = $(this).val().trim().toLowerCase();
      const dropdown = $("#collegeDropdown");

      dropdown.empty().hide();

      if (searchTerm.length === 0) return;

      const matches = [
        {
          code: "DIGI1001",
          name: "Digival IT Solutions (Admin)",
          isAdmin: true,
        },
        ...collegeData.filter(
          (c) =>
            c.code.toLowerCase().includes(searchTerm) ||
            c.name.toLowerCase().includes(searchTerm)
        ),
      ];

      if (matches.length > 0) {
        matches.forEach((college) => {
          dropdown.append(
            $('<div class="dropdown-item"></div>')
              .text(`${college.code} - ${college.name}`)
              .click(() => {
                $("#collegeCode").val(college.code);
                if (college.isAdmin) {
                  $("#collegeName").text(college.name);
                  $("#displayCollegeCode").text(college.code);
                  $("#login-button").attr(
                    "data-college",
                    JSON.stringify(college)
                  );
                }
                dropdown.hide();
              })
          );
        });
        dropdown.show();
      }
    });

    // Hide dropdown when clicking outside
    $(document).on("click", function (e) {
      if (!$(e.target).closest("#collegeCode, #collegeDropdown").length) {
        $("#collegeDropdown").hide();
      }
    });

    // Add event listener for Enter key on password field
    $("#password").on("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        $("#login-button").click();
      }
    });

    // Also add Enter key support for email field
    $("#login-email").on("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        $("#login-button").click();
      }
    });

    // Also add Enter key support for college code field
    $("#collegeCode").on("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        $("#step1-submit").click();
      }
    });

    setTimeout(checkCollegeCodeInURL, 100);
  }

  // Main function to initialize the script
  window.initializeAuth = function () {
    addDynamicStyles();
    checkSession();
  };
  initializeAuth();

     const lang = localStorage.getItem("lang") || "en";
  $("#lang-toggles").prop("checked", lang === "ar");

    $(document).on("click", "#lang-toggles", function() {
     localStorage.setItem("lang",$("#lang-toggles").prop('checked')?"ar":"en");
      renderLanguage('../../fullscreenexam/dashboardLanguage/');
      updateDirection();
  });

  renderLanguage('../../fullscreenexam/dashboardLanguage/');
});

// Function to check for college code in URL query parameters
function checkCollegeCodeInURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const cidParam = urlParams.get("cid");

  if (cidParam && $("#collegeCode").length) {
    $("#collegeCode").val(cidParam);

    const inputCode = cidParam.trim();
    let collegeFound = false;

    if (inputCode === "DIGI1001") {
      collegeFound = true;
      const adminCollege = {
        code: "DIGI1001",
        name: "Digival IT Solutions (Admin)",
        isAdmin: true,
        settings: {
          logo: { url: `${getDynamicImagePath("Digival.png")}` },
          colors: { primary: "#1877f2" },
        },
      };

      $("#collegeName").text(adminCollege.name);
      $("#displayCollegeCode").text(adminCollege.code);
      $(".college-logo").attr("src", adminCollege.settings.logo.url);

      setCssVariable("--primary", adminCollege.settings.colors.primary);
      setCssVariable(
        "--primary-light",
        lightenHexColor(adminCollege.settings.colors.primary, 93)
      );

      $("#login-button").attr("data-college", JSON.stringify(adminCollege));
    } else {
      if (collegeData.length === 0) {
        setTimeout(() => {
          if (collegeData.length > 0) {
            checkCollegeCodeInURL();
          } else {
            $("#step2-error")
              .text("Unable to verify college code. Please try again later.")
              .addClass("show");
          }
        }, 1000);

        switchStep(2);
        return;
      }

      // Check in college data
      const foundCollege = collegeData.find(
        (college) => college.code.toLowerCase() === inputCode.toLowerCase()
      );

      if (foundCollege) {
        collegeFound = true;
        $("#collegeName").text(foundCollege.name);
        $("#displayCollegeCode").text(foundCollege.code);

        // Set college logo if available
        if (foundCollege?.settings?.logo?.url) {
          $(".college-logo").attr("src", foundCollege.settings.logo.url);
        } else {
          $(".college-logo").hide();
          $(".college-logo-container").html(`
              <div class="no-logo">
                <i class="fa-solid fa-building-columns"></i>
                <div class="no-logo-text">No logo Available</div>
              </div>
            `);
        }

        if (foundCollege.settings?.colors?.primary) {
          setCssVariable("--primary", foundCollege.settings.colors.primary);
          setCssVariable(
            "--primary-light",
            lightenHexColor(foundCollege.settings.colors.primary, 93)
          );
        }

        $("#login-button").attr("data-college", JSON.stringify(foundCollege));
      }
    }

    switchStep(2);

    if (!collegeFound) {
      $("#step2-error")
        .text("Invalid college code. Please check and try again.")
        .addClass("show");
      $("#collegeName").text("Unknown College");
      $("#displayCollegeCode").text(inputCode);
      $(".college-logo").hide();
      $(".college-logo-container").html(`
          <div class="no-logo">
            <i class="fa-solid fa-building-columns"></i>
            <div class="no-logo-text">No logo Available</div>
          </div>
        `);
    }
  }
}

function fetchCollegeCode() {
  fetch(`${base_url}/account`, {
    method: "GET",
    headers: apiHeaders,
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      const datalist = $("#collegeSuggestions");
      datalist.empty();
      collegeData = [];
      data.data.forEach((college) => {
        collegeData.push(college);
        datalist.append($("<option>").val(college.code));
      });

      const urlParams = new URLSearchParams(window.location.search);
      const cidParam = urlParams.get("cid");

      if (cidParam) {
        checkCollegeCodeInURL();
      } else {
        checkCollegeCode();
      }
    })
    .catch((error) => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("cid")) {
        checkCollegeCodeInURL();
      }
    });
}

function handleCollegeCode() {
  const inputCode = $("#collegeCode").val().trim();
  const isFromUrlParam = new URLSearchParams(window.location.search).has("cid");

  if (isFromUrlParam) {
    return;
  }

  if (inputCode === "DIGI1001") {
    const adminCollege = {
      code: "DIGI1001",
      name: "Digival IT Solutions (Admin)",
      isAdmin: true,
      settings: {
        logo: { url: `${getDynamicImagePath("Digival.png")}` },
        colors: { primary: "#1877f2" },
      },
    };

    $("#collegeName").text(adminCollege.name);
    $("#displayCollegeCode").text(adminCollege.code);
    $(".college-logo").attr("src", adminCollege.settings.logo.url);

    // Update CSS variables
    setCssVariable("--primary", adminCollege.settings.colors.primary);
    setCssVariable(
      "--primary-light",
      lightenHexColor(adminCollege.settings.colors.primary, 93)
    );

    // Store admin college data
    $("#login-button").attr("data-college", JSON.stringify(adminCollege));
    switchStep(2);
    return;
  }

  // Existing college validation
  const foundCollege = collegeData.find(
    (college) => college.code.toLowerCase() === inputCode.toLowerCase()
  );

  if (foundCollege) {
    // Original college handling code
    $("#collegeName").text(foundCollege.name);
    $("#displayCollegeCode").text(foundCollege.code);
    $(".college-logo").attr("src", foundCollege?.settings?.logo?.url);

    // Set CSS custom property if color exists
    if (foundCollege.settings?.colors?.primary) {
      setCssVariable("--primary", foundCollege?.settings?.colors?.primary);
      setCssVariable(
        "--primary-light",
        lightenHexColor(foundCollege.settings.colors.primary, 93)
      );
    }

    $("#login-button").attr("data-college", JSON.stringify(foundCollege));
    switchStep(2);
  } else if(!inputCode){
 $("#step1-error").text("Please enter your college code.").addClass("show");
  } else {
    $("#step1-error").text("Invalid college code").addClass("show");
  }
}

function checkCollegeCode() {
  const storedCode = localStorage.getItem("collegeCode");

  if (!storedCode) return;

  const foundCollege = collegeData.find(
    (college) => college.code.toLowerCase() === storedCode.toLowerCase()
  );

  if (foundCollege) {
    $("#collegeName").text(foundCollege.name);
    $("#displayCollegeCode").text(foundCollege.code);
    $("#collegeCode").val(foundCollege.code);

    if (foundCollege.settings?.colors?.primary) {
      setCssVariable("--primary", foundCollege.settings.colors.primary);
      setCssVariable(
        "--primary-light",
        lightenHexColor(foundCollege.settings.colors.primary, 93)
      );
    }

    $("#login-button").attr("data-college", JSON.stringify(foundCollege));
    switchStep(2);
  }
}

function switchStep(stepNumber) {
  $(".error-message").removeClass("show").text("");
  $(".step").removeClass("active");
  $(`#step${stepNumber}`).addClass("active");

  // Check if we came from URL parameter
  const isFromUrlParam = new URLSearchParams(window.location.search).has("cid");

  // Toggle a class on the login-container to control the visibility of pseudo-elements
  if (stepNumber === 2) {
    $(".login-container").addClass("hide-pseudo");

    // Always hide back button if coming from URL parameter
    if (isFromUrlParam) {
      $("#backtostep1").hide();
    }
  } else {
    $(".login-container").removeClass("hide-pseudo");
  }
}

function getDynamicImagePath(name) {
  const domainUrl = window.location.origin;
  return domainUrl + `/common/imgs/${name}`;
}

function updateDirection() {
  const lang = localStorage.getItem("lang") || "en";
  $("body").attr("dir", lang === "ar" ? "rtl" : "ltr");
}


function setCssVariable(name, value) {
  try {
    if (document.documentElement?.style?.setProperty) {
      document.documentElement.style.setProperty(name, value);
    }
  } catch (e) {
    console.warn(`Failed to set CSS variable ${name}:`, e);
  }
}

function lightenHexColor(hex, percent) {
  // Validate hex input
  hex = hex.replace(/[^0-9a-f]/gi, "");
  if (hex.length < 6) {
    console.error("Invalid hex color:", hex);
    return "#e7f3ff"; // Default fallback
  }

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Lighten each channel
  const lighten = (channel) =>
    Math.min(255, channel + ((255 - channel) * percent) / 100);

  // Convert back to hex
  return `#${[
    Math.round(lighten(r)),
    Math.round(lighten(g)),
    Math.round(lighten(b)),
  ]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")}`;
}
