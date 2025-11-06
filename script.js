// const url_bg_img='https://script.google.com/macros/s/AKfycbypkVn2OKUSxc9679YDerWxFtpRyNnLeA5Jirda0SD0ILhaJNTFZDz7z0sgxVH2ONnJ/exec/exec?mode=image&id=1X85r3e3v_Smt7WS0FukWtRJZgXxeDwkN';
const urlAPI = 'https://script.google.com/macros/s/AKfycbypkVn2OKUSxc9679YDerWxFtpRyNnLeA5Jirda0SD0ILhaJNTFZDz7z0sgxVH2ONnJ/exec';
// const vietQR = 'https://img.vietqr.io/image/vpb-939949568678-qr_only.jpg?addInfo={addInfo}&accountName={accountName}'
const vietQR = 'https://img.vietqr.io/image/vietinbank-113366668888-qr_only.jpg?addInfo={addInfo}&accountName={accountName}'
// const vietQR = '{addInfo}&accountName={accountName}' 113366668888
// $(function(){
//   $.get(url_bg_img, function(data) {
//     console.log("Kết quả trả về:", data);
//     // Nếu data là chuỗi base64, ta gán vào background
//     $("body").css("background-image", `url('${data}')`);
//   }).fail(function(err) {
//     console.error("Lỗi khi load ảnh:", err);
//   });
// });

const getCustomerID = function (name,dob,phone) {
  name=name.split(' ').map(x=>x.substr(0,1).toUpperCase()).join('');
  dob=dob.replace(/-/g,'');
  
  let now = new Date();
  let yyyymmdd = now.getFullYear().toString().substr(2) +
                 String(now.getMonth() + 1).padStart(2, '0') +
                 String(now.getDate()).padStart(2, '0');

  const hhmmssms = String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0') +
    String(now.getMilliseconds()).padStart(3, '0');

  return `${yyyymmdd}-${hhmmssms}-${name}-${dob}-${phone.substr(-5)}`; 
}

$('#registerForm').on('submit', function(e) {
  e.preventDefault();
  
  let getValueFrom= async()=>{ 
    let input_obj = Object.fromEntries(
      Object.values($(this).find("input")).filter(x=>$(x).attr('name')!==undefined).map(x=>[$(x).attr("name").toUpperCase(), $(x).val()])
    );
    input_obj['action']='ACCOUNT_INSERT';
    return input_obj;
  };

  getValueFrom().then(function(resp_data){
    let customerID = getCustomerID(resp_data["NAME"],resp_data["DOB"],resp_data["PHONE"]);

    resp_data["ID"]=customerID;

    $.ajax({
      url: urlAPI,
      method: "POST",
      data: resp_data,      
      beforeSend: function () {
        $("#spinnerForm").show();
        $("#btnSubmit").hide();
        $("form#registerForm :input").attr("readonly", true);
        $('form#registerForm :input:not(input[type="radio"])').css("color", '#666');
      },
      success: function(res) {
        if(res.status === 'success'){
          console.log("✅ Thành công:", res);
          $("#registerFormContainer").hide();
          $("#qrContainer").show();
          $('#lblError').text(customerID);
          // let QR = vietQR.replace('{accountName}','Le Xuan Hien').replace('{addInfo}',res.code);
          let sQR = 'https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=' + res.code;
          console.log(sQR)
          $('#imgQR').attr('src',sQR);
        }
        else{
          $('#lblError').text(res.message);
        }
      },
      error: function(xhr, status, err) {
        console.error("❌ Lỗi:", status, err);
        $('#lblError').text("❌ Lỗi:", status, err);
      },
      complete: function() {
        $("form#registerForm :input").attr("readonly", false);
        $('form#registerForm :input:not(input[type="radio"])').css("color", '#fff');
        $("#spinnerForm").hide();
        $("#btnSubmit").show();
      }
    });
  });
});

$('#editBtn').click(function(){
    $("#registerFormContainer").show();
    $("#qrContainer").hide();
});

$('#paidBtn').click(function(){
    $("#qrContainer").hide();
    $("#uploadSection").show();
});

$('#uploadBtn').click(function(){
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if(!file) return alert("Chọn hình trước khi upload.");
    $('#spinnerUpload').show();
    $('#uploadBtn').hide();

    const reader = new FileReader();
    reader.onload = e=>{
      $.ajax({
        url: urlAPI,
        method: "POST",
        data: { uniqueId: $('#lblError').text(), imageBase64: e.target.result, action: 'IMAGE_UPLOAD' },      
        beforeSend: function () {
          $("#spinnerForm").show();
          $("#btnSubmit").hide();
          $("#fileInput").attr("disabled", true);
          $('#fileInput').css("color", '#666');
        },
        success: function(res) {
          $('#spinnerUpload').hide();
          $('#uploadSection').hide();
          $('#successSection').show();
          $('#uploadBtn').show();
          $('#uploadForm')[0].reset();
        },
        error: function(xhr, status, err) {
          $('#spinnerUpload').hide();
          $('#uploadBtn').show();
          alert("Lỗi khi upload hình: " + (err.message || err));
        },
        complete: function() {
          $("#fileInput").attr("disabled", false);
          $('#fileInput').css("color", '#fff');
          $("#spinnerForm").hide();
          $("#btnSubmit").show();
        }
      });
    };
    reader.readAsDataURL(file);
});

$('#closeSuccess').click(function(){
    $("#successSection").hide();
    $("#registerFormContainer").show();
});
