// script.js isolado para funcionalidades específicas de clientes e cervejas

const clientesModule = (() => {
    const formatCPF = (cpf) => cpf.replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    const formatTelefone = (telefone) => {
        telefone = telefone.replace(/\D/g, "");
        return telefone.length === 11
            ? telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
            : telefone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    };

    const formatCEP = (cep) => cep.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2");

    const setupFieldFormatListeners = () => {
        const cpfField = document.getElementById("cpf");
        const telefoneField = document.getElementById("telefone");
        const cepField = document.getElementById("cep");

        if (cpfField) {
            cpfField.addEventListener("input", (event) => {
                event.target.value = formatCPF(event.target.value);
            });
        }

        if (telefoneField) {
            telefoneField.addEventListener("input", (event) => {
                event.target.value = formatTelefone(event.target.value);
            });
        }

        if (cepField) {
            cepField.addEventListener("input", (event) => {
                event.target.value = formatCEP(event.target.value);
            });
        }
    };

    const loadClients = async () => {
        const clientTableBody = document.getElementById("client-table-body");
        try {
            const response = await fetch("/clientes");
            if (response.ok) {
                const clients = await response.json();
                clientTableBody.innerHTML = "";
                clients.forEach(client => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${formatCPF(client.cpf)}</td>
                        <td>${client.nome}</td>
                        <td>${formatTelefone(client.telefone)}</td>
                        <td>${client.logradouro}, ${client.numero}, ${client.complemento || ""}</td>
                        <td>${client.bairro}</td>
                        <td>${client.cidade}</td>
                        <td>
                            <button class="edit-btn client" data-id="${client.cpf}" title="Editar">✏️</button>
                            <button class="delete-btn client" data-id="${client.cpf}" title="Excluir">🗑️</button>
                        </td>
                    `;
                    clientTableBody.appendChild(row);
                });
            } else {
                alert("Erro ao carregar a lista de clientes.");
            }
        } catch (err) {
            console.error("Erro ao carregar clientes:", err);
            alert("Erro ao carregar clientes. Verifique sua conexão.");
        }
    };

    const saveClient = async () => {
        const clientForm = document.getElementById("client-form");
        clientForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(clientForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch("/clientes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    alert("Cliente cadastrado com sucesso!");
                    clientForm.reset();
                    loadClients();
                } else {
                    alert("Erro ao cadastrar cliente.");
                }
            } catch (err) {
                console.error("Erro ao cadastrar cliente:", err);
                alert("Erro ao cadastrar cliente. Verifique sua conexão.");
            }
        });
    };

    return {
        init: () => {
            setupFieldFormatListeners();
            saveClient();
            loadClients();
        },
    };
})();

const cervejasModule = (() => {
    const loadBeers = async () => {
        const beerTableBody = document.getElementById("beer-table-body");
        try {
            const response = await fetch("/cervejas");
            if (response.ok) {
                const beers = await response.json();
                beerTableBody.innerHTML = "";
                beers.forEach(beer => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${beer.cod_barra}</td>
                        <td>${beer.nome}</td>
                        <td>${beer.marca}</td>
                        <td>${beer.tipo}</td>
                        <td>${beer.pais}</td>
                        <td>${beer.preco.toFixed(2)}</td>
                        <td>
                            <button class="edit-btn beer" data-id="${beer.cod_barra}" title="Editar">✏️</button>
                            <button class="delete-btn beer" data-id="${beer.cod_barra}" title="Excluir">🗑️</button>
                        </td>
                    `;
                    beerTableBody.appendChild(row);
                });
            } else {
                alert("Erro ao carregar a lista de cervejas.");
            }
        } catch (err) {
            console.error("Erro ao carregar cervejas:", err);
            alert("Erro ao carregar cervejas. Verifique sua conexão.");
        }
    };

    const saveBeer = async () => {
        const beerForm = document.getElementById("beer-form");
        beerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(beerForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch("/cervejas", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    alert("Cerveja cadastrada com sucesso!");
                    beerForm.reset();
                    loadBeers();
                } else {
                    alert("Erro ao cadastrar cerveja.");
                }
            } catch (err) {
                console.error("Erro ao cadastrar cerveja:", err);
                alert("Erro ao cadastrar cerveja. Verifique sua conexão.");
            }
        });
    };

    return {
        init: () => {
            saveBeer();
            loadBeers();
        },
    };
})();

// Inicialização baseada na página atual
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("client-form")) {
        clientesModule.init();
    }

    if (document.getElementById("beer-form")) {
        cervejasModule.init();
    }
});
