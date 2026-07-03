// 2. Buscar o arquivo JSON e popular as tarefas com cálculo de tempo
    fetch('../assets/json/protocol.json')
        .then(response => response.json())
        .then(data => {
            for (const [dayId, tasks] of Object.entries(data)) {
                
                // Agrupar tarefas pela mesma hora para tratar conflitos (múltiplas tarefas)
                const tasksByHour = {};
                tasks.forEach(t => {
                    if (!tasksByHour[t.hourId]) tasksByHour[t.hourId] = [];
                    tasksByHour[t.hourId].push(t);
                });

                for (const [hourId, hourTasks] of Object.entries(tasksByHour)) {
                    const targetHourDiv = document.getElementById(`day-${dayId}-hour-${hourId}`);
                    if (!targetHourDiv) continue;

                    const totalTasks = hourTasks.length;

                    hourTasks.forEach((task, index) => {
                        const taskDiv = document.createElement('div');
                        taskDiv.className = task.type; 

                        // Valores padrão caso falhe o Regex
                        let topPx = 0;
                        let heightPx = 110; 

                        // REGEX para extrair horários nos formatos "06:30 - 07:10" ou "12:50 a 13:20"
                        const timeMatch = task.time.match(/(\d{1,2}):(\d{2})\s*(a|-)\s*(\d{1,2}):(\d{2})/i);
                        
                        if (timeMatch) {
                            const startH = parseInt(timeMatch[1]);
                            const startM = parseInt(timeMatch[2]);
                            const endH = parseInt(timeMatch[4]);
                            const endM = parseInt(timeMatch[5]);

                            // 1 hora = 120px => 1 minuto = 2px
                            topPx = startM * 2; 

                            // Cálculo da duração total em minutos
                            let durationMins = ((endH - startH) * 60) + (endM - startM);
                            
                            // Garante uma altura mínima de 15mins (30px) para não quebrar o layout do texto
                            if (durationMins < 15) durationMins = 15; 
                            
                            heightPx = durationMins * 2;
                        }

                        // Aplica o posicionamento vertical exato
                        taskDiv.style.top = `${topPx}px`;
                        taskDiv.style.height = `${heightPx}px`;

                        // Lógica para quando tem mais de uma tarefa no mesmo horário
                        if (totalTasks > 1) {
                            const widthPercent = 90 / totalTasks; 
                            taskDiv.style.width = `${widthPercent}%`;
                            taskDiv.style.left = `${5 + (index * widthPercent)}%`; // Coloca lado a lado
                        } else {
                            taskDiv.style.width = '90%';
                            taskDiv.style.left = '5%'; // Centraliza no slot
                        }

                        taskDiv.innerHTML = `
                            <h3 class="protocol-task-name">${task.name}</h3>
                            <time class="protocol-task-hour" datetime="${task.time}">${task.time}</time>
                            <span class="protocol-task-tag" style="margin-top:auto;">${task.tag}</span>
                        `;
                        
                        targetHourDiv.appendChild(taskDiv);
                    });
                }
            }
        })
        .catch(error => console.error('Erro ao carregar as tarefas:', error));