import React, {useEffect, useState } from 'react'
import Container from 'react-bootstrap/Container'
import Table from 'react-bootstrap/Table'
import Alert from 'react-bootstrap/Alert'
import { ipcRenderer } from 'electron'

import LogItem from './LogItem'
import AddLogItem from './AddLogItem'


const App = () => {
	const [logs, setLogs] = useState([])
	const [alert, setAlert] = useState({
		show: false,
		message: '',
		variant: 'success'
	})


	useEffect(() => {
		ipcRenderer.send('logs:load')
		ipcRenderer.on('logs:get', (e, logs) => {
			setLogs(JSON.parse(logs))
		})
		ipcRenderer.on('logs:clear', () => {
			setLogs([])
			showAlert('Logs cleared')
		})
	}, [])

	function showAlert(message, variant = 'success', seconds = 3000) {
		setAlert({
			show: true,
			message,
			variant
		})

		setTimeout (() => {
			setAlert({
				show: false,
				message: '',
				variant: 'success'
			})
		}, seconds)
	}

	function addItem (item) {
		if (item.text === '' || item.user === '' || item.priority === '') {
			showAlert('All fields required.', 'danger', 1000)
			return false
		}
		ipcRenderer.send('logs:add', item)
		showAlert('Log Added')

		item.created = new Date().toString()
		setLogs([...logs, item])
	}

	function deleteItem (_id) {
		// setLogs(logs.filter((item) => item._id !== _id))
		ipcRenderer.send('logs:delete', _id)
		showAlert('Log Removed')
	}

	return (
		<Container>
			<AddLogItem addItem={addItem}/>
			{alert.show && <Alert variant={alert.variant}>{alert.message}</Alert>}
			<Table>
				<thead>
					<tr>
						<th>Priority</th>
						<th>Log/Text</th>
						<th>User</th>
						<th>Create</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{
						logs.map((log) => (
							<LogItem log={log} key={log._id} deleteItem={deleteItem}/>
						))
					}
				</tbody>
			</Table>
    	</Container>
	)
}

export default App
