import { useState } from "react";
import { api } from "../api/client";

const initialStudentForm = {
  name: "",
  guardian: "",
  phone: "",
  course: "",
  remaining_hours: 12,
};

const createInitialRenewForm = () => ({
  student_id: "",
  hours: 10,
  amount: 2000,
  note: "",
});

const initialRenewForm = createInitialRenewForm();

export function StudentsPage({ students, reminders, renewals, onCreated }) {
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [renewForm, setRenewForm] = useState(initialRenewForm);
  const [message, setMessage] = useState("");
  const [renewMessage, setRenewMessage] = useState("");
  const [renewing, setRenewing] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});

  const submitStudent = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await api.createStudent(studentForm);
      setStudentForm(initialStudentForm);
      await onCreated();
      setMessage("学员已新增");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const submitRenew = async (event) => {
    event.preventDefault();
    setRenewMessage("");
    if (renewing) {
      return;
    }
    if (!renewForm.student_id) {
      setRenewMessage("请选择学员");
      return;
    }
    if (!(renewForm.amount > 0)) {
      setRenewMessage("金额不能为零");
      return;
    }
    setRenewing(true);
    try {
      await api.renewStudent(renewForm);
      setRenewForm(createInitialRenewForm());
      await onCreated();
      setRenewMessage("续费登记成功");
    } catch (error) {
      setRenewMessage(error.message);
    } finally {
      setRenewing(false);
    }
  };

  const selectStudentForRenew = (student) => {
    if (renewing) {
      return;
    }
    setRenewForm({ ...createInitialRenewForm(), student_id: student.id });
    setRenewMessage("");
  };

  const toggleHistory = (studentId) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const studentRenewals = (studentId) => {
    return renewals.filter((r) => r.student_id === studentId);
  };

  return (
    <div className="two-column">
      <div className="page-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>新增学员</h2>
            <span>建档后可直接签到</span>
          </div>
          <form className="form-stack" onSubmit={submitStudent}>
            <div className="form-row">
              <label>
                姓名
                <input value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} required />
              </label>
              <label>
                课程
                <input value={studentForm.course} onChange={(event) => setStudentForm({ ...studentForm, course: event.target.value })} required />
              </label>
            </div>
            <div className="form-row">
              <label>
                家长
                <input value={studentForm.guardian} onChange={(event) => setStudentForm({ ...studentForm, guardian: event.target.value })} required />
              </label>
              <label>
                电话
                <input value={studentForm.phone} onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} required />
              </label>
            </div>
            <label>
              初始课时
              <input
                type="number"
                min="0"
                step="0.5"
                value={studentForm.remaining_hours}
                onChange={(event) => setStudentForm({ ...studentForm, remaining_hours: Number(event.target.value) })}
              />
            </label>
            <button className="primary-button" type="submit">保存学员</button>
            {message ? <div className="inline-message">{message}</div> : null}
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>续费登记</h2>
            <span>增加课时并记录缴费</span>
          </div>
          <form className="form-stack" onSubmit={submitRenew}>
            <label>
              选择学员
              <select
                value={renewForm.student_id}
                onChange={(event) => setRenewForm({ ...renewForm, student_id: event.target.value })}
                disabled={renewing}
                required
              >
                <option value="">请选择学员</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.course}（剩余 {student.remaining_hours} 课时）
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                购买课时
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={renewForm.hours}
                  onChange={(event) => setRenewForm({ ...renewForm, hours: Number(event.target.value) })}
                  disabled={renewing}
                  required
                />
              </label>
              <label>
                缴费金额（元）
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={renewForm.amount}
                  onChange={(event) => setRenewForm({ ...renewForm, amount: Number(event.target.value) })}
                  disabled={renewing}
                  required
                />
              </label>
            </div>
            <label>
              续费备注
              <textarea
                rows="2"
                value={renewForm.note}
                onChange={(event) => setRenewForm({ ...renewForm, note: event.target.value })}
                placeholder="如：暑期班续费、季度套餐等"
                disabled={renewing}
              />
            </label>
            <button className="primary-button" type="submit" disabled={renewing}>
              {renewing ? "提交中..." : "确认续费"}
            </button>
            {renewMessage ? <div className="inline-message">{renewMessage}</div> : null}
          </form>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h2>学员课时</h2>
          <span>{students.length} 人</span>
        </div>
        {students.map((student) => {
          const warning = reminders.some((item) => item.id === student.id);
          const records = studentRenewals(student.id);
          const isExpanded = !!expandedStudents[student.id];
          const displayRecords = isExpanded ? records : records.slice(0, 3);
          return (
            <div className="student-card" key={student.id}>
              <div className="table-row">
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.course} / {student.guardian} / {student.phone}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <b className={warning ? "warning-text" : ""}>{student.remaining_hours} 课时</b>
                  <button
                    type="button"
                    className="small-button"
                    onClick={() => selectStudentForRenew(student)}
                    disabled={renewing}
                  >
                    {renewing ? "处理中" : "续费"}
                  </button>
                </div>
              </div>
              {records.length > 0 && (
                <div className="renewal-history">
                  <div
                    className="renewal-history-title"
                    onClick={() => toggleHistory(student.id)}
                    style={{ cursor: "pointer" }}
                  >
                    续费记录（共 {records.length} 条）
                    <span style={{ marginLeft: "6px" }}>
                      {isExpanded ? "收起" : records.length > 3 ? "展开全部" : ""}
                    </span>
                  </div>
                  {displayRecords.map((record) => (
                    <div className="renewal-record" key={record.id}>
                      <span>{record.renewed_at}</span>
                      <span>+{record.hours} 课时</span>
                      <span>¥{record.amount}</span>
                      {record.note && <span className="renewal-note">{record.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
