import { useState } from "react";
import styles from  "../styles/styles.module.css";
import jsPDF from "jspdf";

function Resume() {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    summary: "",
    certifications: "",
    skills: "",
    education: "",
    photo: null,
    experiences: [{ company: "", role: "", duration: "", details: "" }],
  });

  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleExperienceChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...formData.experiences];
    updated[index][name] = value;
    setFormData({ ...formData, experiences: updated });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experiences: [
        ...formData.experiences,
        { company: "", role: "", duration: "", details: "" },
      ],
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    if (formData.photo) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgData = e.target.result;
        doc.addImage(imgData, "JPEG", 160, 10, 30, 30);
        buildPDF(doc);
      };
      reader.readAsDataURL(formData.photo);
    } else {
      buildPDF(doc);
    }
  };

  const buildPDF = (doc) => {
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(formData.name, 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(formData.title, 105, 30, { align: "center" });

    doc.setFontSize(12);
    doc.text(`${formData.email} | ${formData.phone}`, 105, 36, {
      align: "center",
    });

    let y = 50;
    const section = (title, text, center = false) => {
      if (!text.trim()) return;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, center ? 105 : 20, y, center ? { align: "center" } : {});
      y += 4;
      doc.setLineWidth(0.3);
      doc.line(20, y, 190, y);
      y += 6;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 4;
    };

    section("Summary", formData.summary);

    if (formData.experiences.length) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Professional Experience", 20, y);
      y += 4;
      doc.setLineWidth(0.3);
      doc.line(20, y, 190, y);
      y += 6;

      formData.experiences.forEach((exp) => {
        const { company, role, duration, details } = exp;
        if (company || role || duration || details) {
          doc.setFont("helvetica", "bold");
          doc.text(`${role} at ${company} (${duration})`, 20, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(details, 170);
          doc.text(lines, 20, y);
          y += lines.length * 6 + 4;
        }
      });
    }

    section("Certifications", formData.certifications);
    section("Skills", formData.skills);
    section("Education", formData.education);

    doc.save("resume.pdf");
  }
  const fetchAISuggestion = async (prompt) => {
    setLoadingAI(true);
    setErrorAI(null);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer YOUR_OPENAI_API_KEY", // Replace with your actual key
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      setLoadingAI(false);
      return data.choices[0].message.content;
    } catch  {
      setErrorAI("Failed to get AI suggestion");
      setLoadingAI(false);
      return "";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Resume Builder</h1>
        <input
          type="file"
          name="photo"
          accept="image/*"
          onChange={handleChange}
          className={styles.fileInput}
        />
        {Object.entries(formData).map(([key]) => {
          if (key === "experiences" || key === "photo") return null;
          const isTextarea = ["summary", "certifications", "skills", "education"].includes(key);

          if (key === "summary") {
            return (
              <div key={key}>
                <textarea
                  name={key}
                  placeholder="Summary"
                  value={formData[key]}
                  onChange={handleChange}
                  className={styles.textarea}
                />
                <button
                  type="button"
                  onClick={async () => {
                    const prompt = "Write a professional resume summary for a software developer.";
                    const suggestion = await fetchAISuggestion(prompt);
                    setFormData((prev) => ({ ...prev, summary: suggestion }));
                  }}
                  disabled={loadingAI}
                  className={styles.button}
                >
                  {loadingAI ? "Loading..." : "Suggest Summary"}
                </button>
                {errorAI && <p style={{ color: "red" }}>{errorAI}</p>}
              </div>
            );
          }

          return isTextarea ? (
            <textarea
              key={key}
              name={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={formData[key]}
              onChange={handleChange}
              className={styles.textarea}
            />
          ) : (
            <input
              key={key}
              type="text"
              name={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={formData[key]}
              onChange={handleChange}
              className={styles.input}
            />
          );
        })}

        <h2 className={styles.title} style={{ fontSize: "1.25rem" }}>Experience</h2>
        {formData.experiences.map((exp, idx) => (
          <div key={idx} className={styles.experienceBlock}>
            <input
              type="text"
              name="company"
              placeholder="Company"
              value={exp.company}
              onChange={(e) => handleExperienceChange(idx, e)}
              className={styles.input}
            />
            <input
              type="text"
              name="role"
              placeholder="Role"
              value={exp.role}
              onChange={(e) => handleExperienceChange(idx, e)}
              className={styles.input}
            />
            <input
              type="text"
              name="duration"
              placeholder="Duration"
              value={exp.duration}
              onChange={(e) => handleExperienceChange(idx, e)}
              className={styles.input}
            />
            <textarea
              name="details"
              placeholder="Details"
              value={exp.details}
              onChange={(e) => handleExperienceChange(idx, e)}
              className={styles.textarea}
            />
          </div>
        ))}
        <button onClick={addExperience} className={styles.addBtn}>
          Add Experience
        </button>
        <button onClick={generatePDF} className={styles.button}>
          Generate PDF
        </button>
      </div>
    </div>
  );
}

export default Resume;
