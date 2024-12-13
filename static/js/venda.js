
document.addEventListener("DOMContentLoaded", () => {
    let selectedClient = null;
    let saleItems = [];

    // Formatar entrada de CPF ou texto
    function formatSearchInput(input) {
        const value = input.replace(/\D/g, ""); // Remove caracteres não numéricos
        if (value.length > 0 && !isNaN(value)) {
            // Formatar como CPF se for número
            return value
                .slice(0, 11)
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        }
        // Limitar a 100 caracteres para texto
        return input.slice(0, 100);
    }

    // Filtro de clientes na tabela
    function filterClients(query) {
        const clientTableBody = document.getElementById("client-table-body");
        const rows = clientTableBody.querySelectorAll("tr");

        rows.forEach((row) => {
            const cpfCell = row.querySelector("td:nth-child(1)");
            const nameCell = row.querySelector("td:nth-child(2)");

            if (cpfCell && nameCell) {
                const cpf = cpfCell.textContent.toLowerCase();
                const name = nameCell.textContent.toLowerCase();
                row.style.display = cpf.includes(query) || name.includes(query) ? "" : "none";
            }
        });
    }

    // Adicionar listener ao campo de busca de clientes
    const searchClientInput = document.getElementById("search-client");
    if (searchClientInput) {
        searchClientInput.addEventListener("input", (event) => {
            event.target.value = formatSearchInput(event.target.value);
            filterClients(event.target.value.toLowerCase());
        });
    }

    // Filtro de cervejas na tabela
    function filterBeers(query) {
        const beerTableBody = document.getElementById("product-table-body");
        const rows = beerTableBody.querySelectorAll("tr");

        rows.forEach((row) => {
            const nameCell = row.querySelector("td:nth-child(2)");

            if (nameCell) {
                const name = nameCell.textContent.toLowerCase();
                row.style.display = name.includes(query) ? "" : "none";
            }
        });
    }

    // Adicionar listener ao campo de busca de cervejas
    const searchBeerInput = document.getElementById("search-beer");
    if (searchBeerInput) {
        searchBeerInput.addEventListener("input", (event) => {
            const query = event.target.value.toLowerCase();
            filterBeers(query);
        });
    }

    // Carregar lista de clientes
    async function loadClients() {
        try {
            const response = await fetch("/clientes");
            if (!response.ok) {
                throw new Error("Erro ao carregar clientes");
            }
            const clients = await response.json();
            const clientTableBody = document.getElementById("client-table-body");
            clientTableBody.innerHTML = "";
            clients.forEach(client => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${client.cpf}</td>
                    <td>${client.nome}</td>
                    <td>${client.telefone}</td>
                    <td>${client.logradouro}, ${client.numero}</td>
                    <td><button class="select-client-btn" data-cpf="${client.cpf}" data-name="${client.nome}">Selecionar</button></td>
                `;
                clientTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Erro ao carregar lista de clientes:", error);
        }
    }

    // Carregar lista de produtos (cervejas)
    async function loadProducts() {
        try {
            const response = await fetch("/cervejas");
            if (!response.ok) {
                throw new Error("Erro ao carregar cervejas");
            }
            const products = await response.json();
            const productTableBody = document.getElementById("product-table-body");
            productTableBody.innerHTML = "";
            products.forEach(product => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${product.cod_barra}</td>
                    <td>${product.nome}</td>
                    <td>${product.marca}</td>
                    <td>${product.preco.toFixed(2)}</td>
                    <td><input type="number" min="1" value="1" class="product-quantity" data-cod="${product.cod_barra}"></td>
                    <td><button class="add-product-btn" data-cod="${product.cod_barra}" data-name="${product.nome}" data-price="${product.preco}">Adicionar</button></td>
                `;
                productTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Erro ao carregar lista de produtos:", error);
        }
    }

    // Selecionar cliente
    document.getElementById("client-table-body").addEventListener("click", (event) => {
        if (event.target.classList.contains("select-client-btn")) {
            selectedClient = event.target.dataset.cpf;
            const clientName = event.target.dataset.name;

            document.getElementById("client-name").innerText = clientName;
            document.getElementById("selected-client").style.display = "block";
            document.getElementById("client-selection").style.display = "none";
            document.getElementById("product-selection").style.display = "block";

            loadProducts();
        }
    });

    // Adicionar produto à lista de venda
    document.getElementById("product-table-body").addEventListener("click", (event) => {
        if (event.target.classList.contains("add-product-btn")) {
            const cod = event.target.dataset.cod;
            const name = event.target.dataset.name;
            const price = parseFloat(event.target.dataset.price);
            const quantityElement = document.querySelector(`.product-quantity[data-cod="${cod}"]`);
            const quantity = parseInt(quantityElement.value, 10);

            if (isNaN(quantity) || quantity <= 0) {
                alert("Quantidade inválida. Por favor, insira um valor maior que zero.");
                return;
            }

            const item = saleItems.find(item => item.cod === cod);
            if (item) {
                item.quantity += quantity;
            } else {
                saleItems.push({ cod, name, price, quantity });
            }

            updateSaleSummary();
        }
    });

    // Atualizar resumo da venda
    function updateSaleSummary() {
        const saleItemsBody = document.getElementById("sale-items-body");
        saleItemsBody.innerHTML = "";
        let total = 0;
        saleItems.forEach(item => {
            const row = document.createElement("tr");
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>${itemTotal.toFixed(2)}</td>
            `;
            saleItemsBody.appendChild(row);
        });
        document.getElementById("sale-total").innerText = total.toFixed(2);
        document.getElementById("sale-summary").style.display = "block";
    }

    // Finalizar venda
    document.getElementById("finalize-sale").addEventListener("click", async () => {
        if (!selectedClient || saleItems.length === 0) {
            alert("Selecione um cliente e adicione itens para finalizar a venda.");
            return;
        }

        const saleData = {
            client: selectedClient,
            items: saleItems
        };

        try {
            const response = await fetch("/vendas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(saleData)
            });

            if (response.ok) {
                alert("Venda finalizada com sucesso.");
                location.reload();
            } else {
                alert("Erro ao finalizar a venda.");
            }
        } catch (error) {
            console.error("Erro ao finalizar a venda:", error);
            alert("Erro ao finalizar a venda.");
        }
    });

    // Visualizar venda
document.getElementById("sale-results-body").addEventListener("click", async (event) => {
    if (event.target.classList.contains("view-sale-btn")) {
        const saleId = event.target.dataset.id; // ID da venda

        try {
            // Faz a requisição para buscar os detalhes da venda
            const response = await fetch(`/vendas/${saleId}`);
            if (response.ok) {
                const saleData = await response.json();

                // Atualiza os campos de detalhes com os dados da venda
                const venda = saleData.venda;
                document.getElementById("sale-id").innerText = `Venda ID: ${venda.id}`;
                document.getElementById("sale-client-name").innerText = `Cliente: ${venda.cliente_nome}`;
                document.getElementById("sale-total").innerText = `Total: R$ ${venda.total.toFixed(2)}`;

                // Atualiza os itens da venda
                const itemsList = document.getElementById("sale-items-list");
                itemsList.innerHTML = ""; // Limpa a lista anterior
                saleData.itens.forEach((item) => {
                    const li = document.createElement("li");
                    li.textContent = `${item.produto_nome} - Quantidade: ${item.quantidade}, Preço Unitário: R$ ${item.preco_unitario.toFixed(2)}`;
                    itemsList.appendChild(li);
                });

                // Exibe a seção de detalhes da venda
                document.getElementById("sale-details").style.display = "block";
            } else {
                const errorDetails = await response.text();
                console.error("Erro na resposta da API:", errorDetails);
                alert("Erro ao buscar detalhes da venda.");
            }
        } catch (error) {
            console.error("Erro ao buscar detalhes da venda:", error);
            alert("Erro ao buscar detalhes da venda.");
        }
    }
});

// Cancelar venda
document.getElementById("sale-results-body").addEventListener("click", async (event) => {
    if (event.target.classList.contains("cancel-sale-btn")) {
        const saleId = event.target.dataset.id;

        if (confirm("Tem certeza que deseja cancelar esta venda?")) {
            try {
                const response = await fetch(`/vendas/${saleId}/cancelar`, { method: "POST" });
                if (response.ok) {
                    alert("Venda cancelada com sucesso!");
                    event.target.closest("tr").remove();
                } else {
                    alert("Erro ao cancelar a venda.");
                }
            } catch (error) {
                console.error("Erro ao cancelar venda:", error);
            }
        }
    }
});

    
    // Buscar vendas
    document.getElementById("search-sale-btn").addEventListener("click", async () => {
        const searchQuery = document.getElementById("search-sale").value;
        if (!searchQuery) {
            alert("Digite um número de venda, nome, CPF ou data para buscar.");
            return;
        }

        try {
            const response = await fetch(`/vendas?query=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                throw new Error("Erro ao buscar vendas");
            }

            const sales = await response.json();
            const saleResultsBody = document.getElementById("sale-results-body");
            saleResultsBody.innerHTML = "";

            sales.forEach(sale => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${sale.id}</td>
                    <td>${sale.data_hora}</td>
                    <td>${sale.cliente_nome || "-"}</td>
                    <td>${sale.total !== null ? `R$ ${sale.total.toFixed(2)}` : "N/A"}</td>
                    <td>${sale.status || "Ativa"}</td>
                    <td>
                        <button class="view-sale-btn" data-id="${sale.id}">Visualizar</button>
                        <button class="cancel-sale-btn" data-id="${sale.id}">Cancelar</button>
                    </td>
                `;
                saleResultsBody.appendChild(row);
            });
            document.getElementById("sale-results").style.display = "block";
        } catch (error) {
            console.error("Erro ao buscar vendas:", error);
            alert("Erro ao buscar vendas.");
        }
    });

    loadClients();
    loadProducts();
});
