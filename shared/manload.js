export const manloadRoleSlots = [
  "Project Manager Level 1",
  "Consultant Level 3",
  "Consultant Level 2",
  "Project Manager Assistant Level 1"
];
const manloadRoleOrder = manloadRoleSlots.map(role=>role.toLocaleLowerCase());

export function orderManloadTeam(team = []) {
  const positions = team.map(member => Number(member.position));
  if (positions.every(position => Number.isInteger(position) && position >= 0 && position < 4) && new Set(positions).size === positions.length) {
    return [...team].sort((left, right) => Number(left.position) - Number(right.position));
  }
  return [...team].sort((left, right) => {
    const roleIndex = role => {
      const normalized = String(role || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
      const knownIndex = manloadRoleOrder.indexOf(normalized);
      return knownIndex < 0 ? manloadRoleOrder.length : knownIndex;
    };
    return roleIndex(left.role_title) - roleIndex(right.role_title);
  });
}
