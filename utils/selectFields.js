export default function getSelectedFields(fields) {
    let selectedFields = "-password";
    for (let field in fields) {
        if (!fields[field]) {
            selectedFields += ` -${field}`;
        }
    }

    return selectedFields;
}