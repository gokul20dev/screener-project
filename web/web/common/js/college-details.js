$(document).ready(function() {
    // Get accountId from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = localStorage.getItem("accountId");
    const cid = urlParams.get("cid");
    const email = urlParams.get('email')
    
    // If we have an accountId, fetch college details
    if (accountId || cid) {
        if(cid) localStorage.setItem("collegeCode", cid);
        if(accountId) localStorage.setItem("accountId", accountId);
        getCollegeDetails(accountId, cid);
    }
    
  
    if(email) $("#exam-cards-container").css({display:'block'})

});

function getCollegeDetails(accountId, cid) {
    if (!accountId && !cid) return;
    let url 
    if(accountId) url = `${ACCOUNT_END_POINT}?accountId=${accountId}`;
    if(cid) url = `${ACCOUNT_END_POINT}?code=${cid}`;
    makeApiCall({
        url: url,
        method: "GET",
        isApiKey: true,
        successCallback: (response) => {
            if (response && response.data) {
                const collegeName = response.data[0]?.name;
                const logoUrl = response?.data[0]?.settings?.logo?.url;
                
                // Update UI with college information
                if (logoUrl) {
                    $('.logo-img').attr('src', logoUrl);
                }
                
                if (collegeName) {
                    $('.header-left h1').text(collegeName);
                }
            }
        },
        errorCallback: (error) => {
            console.error("Error fetching college details:", error);
        }
    });
} 