// JavaScript code to dynamically load content for "About" and "Resume" sections

document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners to navigation links
  document.getElementById('aboutNav').addEventListener('click', loadAbout);
  document.getElementById('resumeNav').addEventListener('click', loadResume);

  // Function to dynamically load the "About" section
  function loadAbout(event) {
    event.preventDefault();
    clearContent();
    const aboutContent = document.getElementById('mainContent');
    aboutContent.innerHTML = `
      <h2>About Me</h2>
      <p>Expert Python developer with over 3 years of experience, proficient in object-oriented programming, SQL, and BI tools. Skilled in developing and optimizing Python applications, with a strong ability to adapt technical skills to various industries. Effective communicator with a proven track record of problem-solving in fast-paced and agile environments.</p>
    `;
  }

  // Function to dynamically load the "Resume" section
  function loadResume(event) {
    event.preventDefault();
    clearContent();
    const resumeContent = document.getElementById('mainContent');
    resumeContent.innerHTML = `
      <h2>Professional Experience</h2>
      <p>Data Visualization Specialist at Hyperspectral Intelligence Inc, specialized in designing and implementing advanced data visualization tools...</p>
      <p>Data Analyst at Physics Department, University of Tabriz, streamlined Spark SQL and ETL with machine learning for research efficiency...</p>
      <p>Data Analyst at Finance Department, University of Calgary, implemented SQL within a Julia environment for detailed Ethereum blockchain labeling...</p>
      <!-- Add more from your resume as needed -->
    `;
  }

  // Helper function to clear the content
  function clearContent() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = '';
  }
});
