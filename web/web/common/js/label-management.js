let labelItems = {
  EXAM: "exam",
  ACCOUNT_MANAGEMENT:"account_management",
  ACCOUNT_MANAGEMENT_DESCRIPTION:"account_management_description",
  EXAM_MAKER:"exam_maker",
  EXAM_MAKER_DESCRIPTION:"exam_maker_description",
  EXAM_TAKER:"exam_taker",
  EXAM_TAKER_DESCRIPTION:"exam_taker_description",
  STUDENT:"student"
};
let globalLabels = {};


function getCollegeLabel() {
   const accountId = localStorage.getItem("accountId");
  const labelUrl = `${LABEL_END_POINT}?accountId=${accountId}`;
 

  $.ajax({
    url: labelUrl,
    type: "GET",
    headers:apiheaders,
    success: function (response) {
      if (response && response.data && response.data.length > 0) {
        response.data.forEach(function (label) {
          globalLabels[label.k] = label.v;
           
          $(`.common-label-${label.k}`).text(label.v);
        });
      }
    },
    error: function (xhr, status, error) {
      console.error("Error fetching labels:", error);
    }
  });
}

getCollegeLabel();