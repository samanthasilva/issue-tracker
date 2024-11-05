document.addEventListener('DOMContentLoaded', function () {
    const apiUrl = '/api/issues/apitest';
    const issueTableBody = document.getElementById('issueTableBody');
    const issueModal = document.getElementById('issueModal');
    const modalTitle = document.getElementById('modalTitle');
    const addIssueBtn = document.getElementById('addIssueBtn');
    const closeModal = document.querySelector('.close');
    const issueForm = document.getElementById('issueForm');
    const paginationContainer = document.getElementById('pagination');

    const recordsPerPage = 5; // Limite de registros por página
    let currentPage = 1;
    let totalRecords = 0;
    let issues = []; // Array para armazenar os problemas carregados

    // Abrir modal para adicionar um novo problema
    addIssueBtn.onclick = function () {
        openModal('Adicionar Novo Problema');
        issueForm.reset();
        document.getElementById('statusText').value = "Aberto"; // Define status padrão como "Aberto"
    };

    // Fechar modal
    closeModal.onclick = function () {
        closeModalFunc();
    };

    window.onclick = function (event) {
        if (event.target == issueModal) {
            closeModalFunc();
        }
    };

    // Função para carregar problemas e calcular o total de páginas
    function loadIssues() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                issues = data;
                totalRecords = data.length;
                currentPage = 1; // Redefine para a primeira página ao carregar os problemas
                renderTable(); // Renderiza a tabela com a primeira página de dados
                renderPaginationControls();
            })
            .catch(error => console.error('Erro ao carregar problemas:', error));
    }

    // Função para renderizar a tabela com base na página atual
    function renderTable() {
        issueTableBody.innerHTML = '';
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedIssues = issues.slice(startIndex, endIndex);

        paginatedIssues.forEach(issue => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${issue.issue_title}</td>
                <td>${issue.issue_text}</td>
                <td>${issue.created_by}</td>
                <td>${issue.assigned_to}</td>
                <td>${issue.status_text || 'Aberto'}</td>
                <td>
                    <button onclick="editIssue('${issue._id}')">Editar</button>
                    <button onclick="deleteIssue('${issue._id}')">Excluir</button>
                </td>
            `;
            issueTableBody.appendChild(row);
        });
    }

    // Função para renderizar os botões de paginação
    function renderPaginationControls() {
        paginationContainer.innerHTML = ''; // Limpa a paginação anterior

        const totalPages = Math.ceil(totalRecords / recordsPerPage);

        // Botão "Anterior"
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = function () {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                renderPaginationControls();
            }
        };
        paginationContainer.appendChild(prevButton);

        // Botões numéricos de página
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.classList.toggle('active', i === currentPage);
            button.onclick = function () {
                currentPage = i;
                renderTable(); // Atualiza a tabela com a nova página
                renderPaginationControls(); // Atualiza os botões de paginação
            };
            paginationContainer.appendChild(button);
        }

        // Botão "Próximo"
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Próximo';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = function () {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPaginationControls();
            }
        };
        paginationContainer.appendChild(nextButton);
    }

    // Função para abrir o modal com o título especificado
    function openModal(title) {
        modalTitle.textContent = title;
        issueModal.style.display = 'flex';
    }

    function closeModalFunc() {
        issueModal.style.display = 'none';
    }

    // Manipulação do envio do formulário para adicionar/editar problemas
    issueForm.onsubmit = function (event) {
        event.preventDefault();
        const formData = new FormData(issueForm);
        const id = formData.get('_id');
        const method = id ? 'PUT' : 'POST';

        fetch(apiUrl, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData.entries()))
        })
            .then(response => response.json())
            .then(data => {
                closeModalFunc();
                loadIssues(); // Recarrega a tabela para refletir as mudanças
            })
            .catch(error => console.error('Erro ao salvar problema:', error));
    };

    // Função para editar um problema, abrindo-o no modal
    window.editIssue = function (id) {
        fetch(`${apiUrl}?_id=${id}`)
            .then(response => response.json())
            .then(data => {
                if (data && data[0]) {
                    const issue = data[0];
                    document.getElementById('issueId').value = issue._id;
                    document.getElementById('issueTitle').value = issue.issue_title;
                    document.getElementById('issueText').value = issue.issue_text;
                    document.getElementById('createdBy').value = issue.created_by;
                    document.getElementById('assignedTo').value = issue.assigned_to;
                    document.getElementById('statusText').value = issue.status_text || "Aberto"; // Define o status selecionado
                    openModal('Editar Problema');
                }
            })
            .catch(error => console.error('Erro ao carregar problema para edição:', error));
    };

    // Função para excluir um problema pelo ID
    window.deleteIssue = function (id) {
        if (confirm('Tem certeza de que deseja excluir este problema?')) {
            fetch(apiUrl, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: id })
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.result === 'successfully deleted') {
                        alert('Problema excluído com sucesso');
                        loadIssues(); // Recarrega a tabela de problemas
                    } else if (data && data.error) {
                        console.error('Erro:', data.error);
                        alert(`Erro ao excluir problema: ${data.error}`);
                    } else {
                        console.warn('Resposta inesperada ao excluir o problema:', data);
                        alert('Problema excluído com sucesso (resposta inesperada do servidor)');
                        loadIssues();
                    }
                })
                .catch(error => {
                    console.error('Erro ao excluir problema:', error);
                    alert(`Falha ao excluir problema: ${error.message}`);
                });
        }
    };

    // Inicializa a tabela e a paginação
    loadIssues();
});
