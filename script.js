const urlAPI = 'https://script.google.com/macros/s/AKfycbypkVn2OKUSxc9679YDerWxFtpRyNnLeA5Jirda0SD0ILhaJNTFZDz7z0sgxVH2ONnJ/exec';
$(function(){
  localStorage.clear();
  $('.form-container').removeClass('hidden');
  $('registerForm').show();  
});

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
    let input_obj = {};

    // console.log($(this).find('*[name]'));
    $(this).find('*[name]').filter(function() {
      return $(this).attr('type') !== 'radio' || $(this).prop('checked');
    }).each(function() {
      input_obj[$(this).attr('name').toUpperCase()] = $(this).val();
    });
    input_obj['action']='ACCOUNT_INSERT';
    return input_obj;
  };

  getValueFrom().then(function(resp_data){
    let customerID = getCustomerID(resp_data["NAME"],resp_data["DOB"],resp_data["PHONE"]);
    // console.log(resp_data)
    resp_data["ID"]=customerID;

    $.ajax({
      url: urlAPI,
      method: "POST",
      data: resp_data,      
      beforeSend: function () {
        $("#spinnerForm").show();
        $("form#registerForm *").attr("disabled", true);
      },
      success: function(res) {
        if(res.status === 'success'){
          console.log("✅ Thành công:", res);
          localStorage.setItem('customerID', customerID);
          const qr = new QRCodeStyling({
            data: res.code,
            width: 150,
            height: 150,
            image: "favicon.png", // logo giữa QR
            dotsOptions: {
              color: "#c8102e", // đỏ thương hiệu
              type: "rounded"
            },
            backgroundOptions: {
              color: "#f8e6b8"
            }
          });
          qr.append(document.getElementById("qr"));
          // dùng getRawData để biết khi QR đã sẵn sàng
          qr.getRawData("png").then((blob) => {
            console.log("QR Code đã render xong!"); // ✅ Sự kiện complete            
            $("#registerForm").hide();
            $("#qrContainer div#qr").html('');
            $("#qrContainer").show();
          });
        }
        else{
          $('#lblError').text(res.message);
        }
      },
      error: function(xhr, status, err) {
        console.error("❌ Lỗi:", status, err);
        $('#lblError').text("❌ Lỗi:", status, err);
      },
      complete: function(xhr) {
        $("form#registerForm *").attr("disabled", false);
        $("#spinnerForm").hide();
        console.log(xhr)
      }
    });
  });
});

$('#editBtn').click(function(){
    $("#registerForm").show();
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

    const reader = new FileReader();
    reader.onload = e=>{
      $.ajax({
        url: urlAPI,
        method: "POST",
        data: { uniqueId: localStorage.getItem('customerID'), imageBase64: e.target.result, action: 'IMAGE_UPLOAD' },      
        beforeSend: function () {
          $("#spinnerForm").show();
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
          $("#spinnerForm").hide();
        }
      });
    };
    reader.readAsDataURL(file);
});

$('#closeSuccess').click(function(){
    $("#successSection").hide();
    $("#registerForm").show();
});

const fileUpload = document.getElementById('fileUpload');
const input = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');

// Hiển thị tên file khi chọn
input.addEventListener('change', () => {
  if(input.files.length > 0) {
    fileName.textContent = input.files[0].name;
  } else {
    fileName.textContent = "Chưa có tệp nào";
  }
});

// Kéo thả
fileUpload.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileUpload.classList.add('dragover');
});

fileUpload.addEventListener('dragleave', () => {
  fileUpload.classList.remove('dragover');
});

fileUpload.addEventListener('drop', (e) => {
  e.preventDefault();
  fileUpload.classList.remove('dragover');
  if(e.dataTransfer.files.length > 0) {
    input.files = e.dataTransfer.files; // gán file vào input
    fileName.textContent = e.dataTransfer.files[0].name;
  }
});


