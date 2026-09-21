export default function EmployeeTable({ rows }) {
  return (
    <table data-testid="table">
      <thead>
        <tr><th>Name</th><th>Role</th></tr>
      </thead>
      <tbody data-testid="tableBody">
        {rows.map((e) => (
          <tr key={e.id}>
            <td>{e.name}</td>
            <td>{e.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
