document.addEventListener("DOMContentLoaded",function(){

console.log("resume.js loaded");

const form=document.getElementById("resumeForm");

if(!form){
console.error("resumeForm not found");
return;
}

const photoInput=document.getElementById("photo");
const fileName=document.getElementById("file-name");

if(photoInput){

photoInput.addEventListener("change",function(){

fileName.textContent=this.files[0]
? "Uploaded: "+this.files[0].name
: "No image selected";

});

}

form.addEventListener("submit",async function(e){

e.preventDefault();

const formData=new FormData();

formData.append("template",form.template.value);
formData.append("studentId",form.studentId.value);
formData.append("name",form.name.value);
formData.append("email",form.email.value);
formData.append("phone",form.phone.value);
formData.append("linkedin",form.linkedin.value);
formData.append("github",form.github.value);
formData.append("summary",form.summary.value);

const skills=form.skills.value
? form.skills.value.split(",").map(s=>s.trim())
: [];

formData.append("skills",JSON.stringify(skills));

formData.append("education",form.education.value);
formData.append("college",form.college.value);
formData.append("year",form.year.value);

formData.append("experience",form.experience.value);

formData.append("projectName",form.projectName.value);
formData.append("projectDescription",form.projectDescription.value);

formData.append("certifications",form.certifications.value);

if(photoInput && photoInput.files.length>0){
formData.append("photo",photoInput.files[0]);
}

try{

const response=await fetch("/api/resume",{
method:"POST",
body:formData
});

if(!response.ok){
throw new Error("Server error");
}

const blob=await response.blob();

const url=window.URL.createObjectURL(blob);

const a=document.createElement("a");

a.href=url;
a.download=`${form.name.value}_Resume.pdf`;

document.body.appendChild(a);

a.click();

document.body.removeChild(a);

window.URL.revokeObjectURL(url);

console.log("Resume generated successfully");

}catch(error){

console.error("Resume generation error:",error);

alert("Something went wrong while generating resume.");

}

});

});