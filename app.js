const { useState, useMemo } = React;

const Upload = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const Search = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const Package = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16.5 9.4 7.55 4.24"></path>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.29 7 12 12 20.71 7"></polyline>
    <line x1="12" y1="22" x2="12" y2="12"></line>
  </svg>
);

const FileText = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const Trash2 = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const App = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocs, setExpandedDocs] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('desc');
  const [notification, setNotification] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleClearAll = () => {
    setItems([]);
    setExpandedDocs(new Set());
    setShowClearConfirm(false);
    showNotification('success', 'Dados limpos com sucesso!');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;

        let separator = ',';
        const firstLine = text.split('\n')[0];
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const commaCount = (firstLine.match(/,/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;

        if (semicolonCount > commaCount && semicolonCount > tabCount) {
          separator = ';';
        } else if (tabCount > commaCount && tabCount > semicolonCount) {
          separator = '\t';
        }

        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          showNotification('error', 'Arquivo CSV vazio ou inválido');
          return;
        }

        const rawHeaders = lines[0].split(separator);
        const headers = rawHeaders.map(h =>
          h.trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
        );

        const docIndex = headers.findIndex(h =>
          h.includes('numero') && h.includes('documento')
        );

        let dateIndex = headers.findIndex(h =>
          h.includes('data') && h.includes('entrada')
        );
        if (dateIndex === -1) {
          dateIndex = headers.findIndex(h =>
            h.includes('data') && h.includes('emissao')
          );
        }

        const codeIndex = headers.findIndex(h =>
          h.includes('codigo') && h.includes('produto')
        );
        const descIndex = headers.findIndex(h =>
          h.includes('descri') && h.includes('produto')
        );

        let qtyIndex = headers.findIndex(h => {
          const normalized = h.replace(/\s+/g, ' ').trim();
          return normalized === 'quantidade de itens' || normalized === 'qtd de itens' || normalized === 'qtde de itens';
        });

        if (qtyIndex === -1) {
          qtyIndex = headers.findIndex(h =>
            h.includes('quantidade') && !h.includes('unidade')
          );
        }

        if ([docIndex, dateIndex, codeIndex, descIndex, qtyIndex].some(i => i === -1)) {
          const missing = [];
          if (docIndex === -1) missing.push('Número do Documento');
          if (dateIndex === -1) missing.push('Data de entrada/emissão');
          if (codeIndex === -1) missing.push('Código do produto');
          if (descIndex === -1) missing.push('Descrição Produto');
          if (qtyIndex === -1) missing.push('Quantidade');

          showNotification('error', `Colunas não encontradas: ${missing.join(', ')}`);
          return;
        }

        const newItems = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
          if (values.length < 3) continue;

          let quantityStr = values[qtyIndex] || '0';
          quantityStr = quantityStr.replace(/\./g, '');
          quantityStr = quantityStr.replace(/,.*$/, '');
          const quantity = parseInt(quantityStr) || 0;

          let productCode = values[codeIndex] || '';
          productCode = productCode.replace(/^0+/, '') || '0';

          newItems.push({
            id: `${Date.now()}-${i}-${Math.random()}`,
            documentNumber: values[docIndex] || 'N/A',
            entryDate: values[dateIndex] || '',
            productCode: productCode,
            productDescription: values[descIndex] || '',
            quantity: quantity
          });
        }

        if (newItems.length === 0) {
          showNotification('error', 'Nenhum item válido encontrado no CSV');
          return;
        }

        setItems(prev => [...prev, ...newItems]);
        showNotification('success', `${newItems.length} itens importados com sucesso!`);
        event.target.value = '';
      } catch (error) {
        showNotification('error', 'Erro ao processar CSV: ' + error);
      }
    };

    reader.onerror = () => {
      showNotification('error', 'Erro ao ler o arquivo');
    };

    reader.readAsText(file, 'ISO-8859-1');
  };

  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = searchTerm === '' ||
        item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productDescription.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      const compareValue = a.quantity - b.quantity;
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [items, searchTerm, sortOrder]);

  const groupedByDocument = useMemo(() => {
    const groups = new Map();
    filteredItems.forEach(item => {
      if (!groups.has(item.documentNumber)) {
        groups.set(item.documentNumber, []);
      }
      groups.get(item.documentNumber)?.push(item);
    });
    return groups;
  }, [filteredItems]);

  const stats = useMemo(() => {
    const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueDocs = groupedByDocument.size;

    return { totalItems, uniqueDocs };
  }, [filteredItems, groupedByDocument]);

  const toggleDocument = (docNumber) => {
    setExpandedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docNumber)) {
        newSet.delete(docNumber);
      } else {
        newSet.add(docNumber);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {showClearConfirm && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
            style={{zIndex: 99999}}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border-2 border-pink-200">
              <h3 className="text-xl font-light text-pink-600 mb-3">Confirmar Limpeza</h3>
              <p className="text-pink-500 mb-6 font-light">
                Tem certeza que deseja limpar todos os dados importados? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-light"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-light"
                >
                  Sim, Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        {notification && (
          <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border-2 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? '✅' : '❌'}
              <span className="font-light">{notification.message}</span>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-pink-600 mb-2">Visualização de Mercadorias</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-pink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-400 text-sm font-light">Total de Itens</p>
                <p className="text-3xl font-light text-pink-600 mt-1">{stats.totalItems}</p>
              </div>
              <Package className="w-12 h-12 text-pink-300" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-light">Notas Fiscais</p>
                <p className="text-3xl font-light text-purple-600 mt-1">{stats.uniqueDocs}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-pink-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-pink-600 mb-2 font-light">Importar CSV</label>
              <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white px-4 py-3 rounded-xl cursor-pointer hover:from-pink-500 hover:to-pink-600 transition-all shadow-md">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-light">Upload</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-sm text-pink-600 mb-2 font-light">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
                <input
                  type="text"
                  placeholder="NF, código ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:outline-none bg-white/50 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-pink-600 mb-2 font-light">Ordenação por Quantidade</label>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="w-full px-4 py-3 rounded-xl bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors text-sm font-light"
              >
                {sortOrder === 'asc' ? '↑ Menor para Maior' : '↓ Maior para Menor'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-pink-100">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors text-sm flex items-center gap-2 ml-auto font-light"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Tudo
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-12 text-center shadow-lg border border-pink-100">
            <Upload className="w-16 h-16 text-pink-300 mx-auto mb-4" />
            <p className="text-pink-400 font-light text-lg">Nenhuma mercadoria importada ainda</p>
            <p className="text-pink-300 text-sm mt-2">Faça upload de um arquivo CSV para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(groupedByDocument.entries()).map(([docNumber, docItems]) => {
              const isExpanded = expandedDocs.has(docNumber);
              const totalQty = docItems.reduce((sum, item) => sum + item.quantity, 0);
              const firstItem = docItems[0];

              return (
                <div key={docNumber} className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
                  <div
                    onClick={() => toggleDocument(docNumber)}
                    className="p-5 cursor-pointer hover:bg-pink-50/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-gradient-to-br from-pink-400 to-pink-500 text-white p-3 rounded-xl shadow-md">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-light text-pink-600">NF {docNumber}</h3>
                        <p className="text-sm text-pink-400 font-light">
                          {firstItem.entryDate} • {docItems.length} produto(s) • {totalQty} itens
                        </p>
                      </div>
                    </div>
                    <div className="text-pink-400">
                      {isExpanded ? '▲' : '▼'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-pink-100">
                      {docItems.map((item) => (
                        <div key={item.id} className="p-4 border-b border-pink-50 last:border-b-0 hover:bg-pink-50/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-pink-600 font-light">
                                <span className="font-normal">{item.productCode}</span> - {item.productDescription}
                              </p>
                            </div>
                            <div className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-sm font-light">
                              {item.quantity} unidades
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
